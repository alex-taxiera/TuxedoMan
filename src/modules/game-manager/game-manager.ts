import {
  type Member,
  type Guild,
  type Role as DiscordRole,
  type Activity,
  Constants,
} from "@alex-taxiera/eris";
import type { DataClient } from "eris-boiler";
import * as logger from "@util/logger";

import { JobQueue } from "@util/job-queue";
import { addRole, editRoles } from "@discord/roles";
import { computeActivity } from "@util/activity";
import db from "@util/db";
import type {
  AnyRole,
  CommonRole,
  CommonRoleType,
  Game,
  Role,
} from "knex/types/tables";

export interface TrackedRole extends Role {
  manageVoice?: boolean;
  voiceChannelCategory?: string;
  voiceChannelThreshold?: number;
  voiceChannelLimit?: number;
}

export interface CommonTrackedRole extends TrackedRole {
  type: CommonRoleType;
}

export interface GameTrackedRole extends TrackedRole {
  type: "game";
  games: string[];
}

export type CommonRoleNames = Record<CommonRoleType, string>;
export type CommonGameRoles = Partial<Record<CommonRoleType, CommonRole>>;
export interface GuildGameRoles {
  commonRoles: CommonGameRoles;
  trackedRoles: GameTrackedRole[];
}

const multiQueue = new Map<string, JobQueue>();

const COMMON_ROLES_TYPES = [
  "playing",
  "streaming",
  "watching",
  "listening",
] as const;

const roleNames: CommonRoleNames = {
  playing: "Other Games",
  listening: "Listening",
  watching: "Watching",
  streaming: "Streaming",
} as const;

const EMPTY_COMMON_ROLES: CommonGameRoles = {
  playing: undefined,
  listening: undefined,
  watching: undefined,
  streaming: undefined,
} as const;

async function createRole(
  bot: DataClient,
  guild: Guild,
  name: string
): Promise<DiscordRole> {
  const role = await guild.createRole({
    name,
    hoist: true,
    permissions: 0,
  });

  const { trackedRoles, commonRoles } = await getRolesForGuild(bot, guild);

  let position: number | undefined = undefined;
  if (trackedRoles.length > 0) {
    const [lowestTrackedRole] = trackedRoles
      .filter((tracked) => tracked.role !== role.id)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We are sure that the role exists in the guild
      .map((tracked) => guild.roles.get(tracked.role)!)
      .sort((a, b) => a.position - b.position);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We are sure that the role exists in the guild
    position = lowestTrackedRole!.position - 1;
  } else {
    const commonRolelist = Object.values(commonRoles).filter(Boolean);
    if (commonRolelist.length > 0) {
      const [highestMiscRole] = commonRolelist
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We are sure that the role exists in the guild
        .map((common) => guild.roles.get(common.role)!)
        .sort((a, b) => b.position - a.position);

      const { position: highestMiscRolePosition } = highestMiscRole ?? {};
      position = highestMiscRole?.position;
    } else {
      const member = guild.members.get(bot.user.id);
      if (member != null) {
        const [lowestControlRole] = member.roles
          .map((id) => guild.roles.get(id)!)
          .sort((a, b) => a.position - b.position);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        position = lowestControlRole!.position - 1;
      }
    }
  }

  if (position != null) {
    role.editPosition(position).catch(logger.error);
  }
  return role;
}

function dbRoleIsCommon(dbRole: AnyRole): dbRole is CommonRole {
  switch (dbRole.type) {
    case "playing":
    case "streaming":
    case "watching":
    case "listening":
      return true;
    default:
      return false;
  }
}

async function getRoleData(
  bot: DataClient,
  guildId: string,
  roleId: string
): Promise<Role | undefined> {
  return await db("role").where("guild", guildId).where("role", roleId).first();
}

function getRoleFromRecord(
  bot: DataClient,
  gameRole: Role
): DiscordRole | undefined {
  const guild = bot.guilds.get(gameRole.guild);
  if (guild?.roles.has(gameRole.role)) {
    return guild.roles.get(gameRole.role);
  }

  db("role")
    .where("guild", gameRole.guild)
    .where("role", gameRole.role)
    .delete()
    .catch(logger.error);
}

async function getGamesForGameRole(
  bot: DataClient,
  gameRole: Role
): Promise<string[]> {
  const games = await db("game")
    .where("guild", gameRole.guild)
    .where("role", gameRole.role);

  return games.map((game) => game.name);
}

export async function checkAllMembers(
  bot: DataClient,
  guild: Guild
): Promise<void> {
  await Promise.all(
    guild.members.map(async (member) => {
      await checkMember(bot, member, computeActivity(member));
    })
  );
}

export async function checkMember(
  bot: DataClient,
  member: Member,
  activity: Pick<Activity, "name" | "type"> | undefined
): Promise<void> {
  const queueKey = `${member.guild.id}-${member.id}`;
  let queue = multiQueue.get(queueKey);
  if (queue == null) {
    const newQueue = new JobQueue();
    multiQueue.set(queueKey, newQueue);
    queue = newQueue;
  }

  await queue
    .push(async () => {
      const { commonRoles, trackedRoles } = await getRolesForGuild(
        bot,
        member.guild
      );

      const toAdd = await getRoleForActivity(
        activity,
        member,
        trackedRoles,
        commonRoles
      );

      if (member.roles.length === 0 && toAdd) {
        await addRole(bot, member.guild.id, member.id, toAdd);
        return;
      }

      const roleIds = [...member.roles];
      if (toAdd && !roleIds.includes(toAdd)) {
        roleIds.push(toAdd);
      }

      const trackedIds = [...Object.values(commonRoles), ...trackedRoles]
        .filter((x) => x != null && x.role !== toAdd)
        .map((tracked) => tracked.role);

      await editRoles(
        member,
        roleIds.filter((id) => !trackedIds.includes(id))
      );
    })
    .catch((res: { error: Error }) => {
      throw res.error;
    });

  if (queue.length === 0) {
    multiQueue.delete(queueKey);
  }
}

async function getRoleForActivity(
  activity: Pick<Activity, "name" | "type"> | undefined,
  member: Member,
  trackedRoles: GameTrackedRole[],
  commonRoles: Partial<Record<CommonRoleType, CommonRole>>
) {
  let toAdd = "";

  if (activity != null) {
    logger.info(`${member.id} HAS ACTIVITY '${activity.name}'`);
    const guildOptions = await db("guild").where("id", member.guild.id).first();

    switch (activity.type) {
      case Constants.ActivityTypes.GAME:
        toAdd =
          trackedRoles.find((gameRole) =>
            gameRole.games.includes(activity.name ?? "")
          )?.role ?? "";

        if (!toAdd && guildOptions?.game) {
          toAdd = commonRoles.playing?.role ?? "";
        }
        break;
      case Constants.ActivityTypes.STREAMING:
        if (guildOptions?.stream) {
          toAdd = commonRoles.streaming?.role ?? "";
        }
        break;
      case Constants.ActivityTypes.LISTENING:
        if (guildOptions?.listen) {
          toAdd = commonRoles.listening?.role ?? "";
        }
        break;
      case Constants.ActivityTypes.WATCHING:
        if (guildOptions?.watch) {
          toAdd = commonRoles.watching?.role ?? "";
        }
        break;
    }
  }

  return toAdd;
}

export async function checkAllRoles(
  bot: DataClient,
  guild: Guild
): Promise<void> {
  await Promise.all(
    guild.roles.map(async (role) => {
      await checkRole(bot, guild, role);
    })
  );
}

export async function checkRole(
  bot: DataClient,
  guild: Guild,
  role: DiscordRole
): Promise<void> {
  if (!guild.roles.has(role.id)) {
    await db("role").where("guild", guild.id).where("role", role.id).delete();
  }
}

export async function getGameRoleByRoleId(
  bot: DataClient,
  guildId: string,
  roleId: string
): Promise<{ dbo: Role; games: string[] } | undefined> {
  const gameRole = await getRoleData(bot, guildId, roleId);

  if (!gameRole) {
    return;
  }

  return {
    dbo: gameRole,
    games: await getGamesForGameRole(bot, gameRole),
  };
}

export async function getGameByName(
  bot: DataClient,
  guildId: string,
  gameName: string
): Promise<Game | undefined> {
  return await db("game")
    .where("guild", guildId)
    .where("name", gameName)
    .first();
}

export async function getRolesForGuild(
  bot: DataClient,
  guild: Guild
): Promise<GuildGameRoles> {
  // const gameRoles = await bot.dbm
  //   .newQuery("role")
  //   .equalTo("guild", guild.id)
  //   .find();

  const gameRoles = await db("role").where("guild", guild.id);
  const commonRoles = { ...EMPTY_COMMON_ROLES };
  const trackedRoles: GameTrackedRole[] = [];

  for (const gameRole of gameRoles) {
    const role = getRoleFromRecord(bot, gameRole);
    if (role == null) {
      continue;
    }
    if (dbRoleIsCommon(gameRole)) {
      commonRoles[gameRole.type] = gameRole;
    } else {
      trackedRoles.push({
        ...gameRole,
        games: await getGamesForGameRole(bot, gameRole),
      });
    }
  }

  return {
    commonRoles,
    trackedRoles,
  };
}

export async function setupMiscRoles(
  bot: DataClient,
  guild: Guild
): Promise<void> {
  const { commonRoles } = await getRolesForGuild(bot, guild);

  await Promise.all(
    COMMON_ROLES_TYPES.map(async (key) => {
      if (commonRoles[key] == null) {
        const { [key]: name } = roleNames;
        const existingRole = guild.roles.find((role) => role.name === name);

        await bot.dbm
          .newObject("role", {
            guild: guild.id,
            role: existingRole?.id ?? createRole(bot, guild, name),
            type: key,
          })
          .save();
      }
    })
  );
}

export async function addTrackedGame(
  bot: DataClient,
  guild: Guild,
  gameName: string,
  roleName: string
): Promise<void> {
  let role = guild.roles.find((role) => role.name === roleName);
  if (role == null) {
    role = await createRole(bot, guild, roleName);
  }

  let gameRole = await getGameRoleByRoleId(bot, guild.id, role.id);
  if (gameRole == null) {
    gameRole = {
      dbo: await db("role").insert({
        guild: guild.id,
        role: role.id,
        type: "game",
      }),
      games: [],
    };
  }

  if (!gameRole.games.includes(gameName)) {
    await bot.dbm
      .newObject("game", {
        name: gameName,
        role: role.id,
        guild: guild.id,
      })
      .save();
  }

  await checkAllMembers(bot, guild);
}

export async function removeTrackedGame(
  bot: DataClient,
  guild: Guild,
  gameName: string
): Promise<void> {
  const game = await getGameByName(bot, guild.id, gameName);
  if (!game) {
    throw new Error("Not found in tracking list!");
  }
  await db("game").where("id", game.id).delete();

  const gameRole = await getGameRoleByRoleId(bot, guild.id, game.role);
  if (gameRole?.games.length === 0) {
    await bot.deleteRole(guild.id, game.role);
    await db("role").where("id", gameRole.dbo.id).delete();
  } else {
    await checkAllMembers(bot, guild);
  }
}
