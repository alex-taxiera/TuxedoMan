import type { DatabaseObject, DataClient } from "eris-boiler";
import {
  type GuildScheduledEvent,
  type Guild,
  type Role,
  DiscordRESTError,
} from "@alex-taxiera/eris";
import { PriorityJobQueue } from "@util/job-queue";
import { addRole, removeRole } from "@discord/roles";
import db from "@util/db";
import type { EventRole } from "knex/types/tables";

const multiQueue = new Map<string, PriorityJobQueue>();

function getQueue(eventId: string): PriorityJobQueue {
  if (!multiQueue.has(eventId)) {
    multiQueue.set(eventId, new PriorityJobQueue(3));
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return multiQueue.get(eventId)!;
}

async function getAllEventRoleDboForGuild(
  bot: DataClient,
  guildId: string
): Promise<EventRole[]> {
  return await db("eventRole").where("guild", guildId);
}

async function createRoleForEvent(
  bot: DataClient,
  event: GuildScheduledEvent
): Promise<Role> {
  return await bot.createRole(event.guild.id, {
    name: event.name,
    permissions: 0,
    mentionable: true,
  });
}

async function deleteRoleAndIgnoreUnknown(
  bot: DataClient,
  guildId: string,
  roleId: string
): Promise<void> {
  await bot.deleteRole(guildId, roleId).catch((error) => {
    if (!(error instanceof DiscordRESTError) || error.code !== 10011) {
      throw error;
    }
  });
}

async function getEventRole(
  _: DataClient,
  guildId: string,
  eventId: string
): Promise<EventRole | undefined> {
  return await db("eventRole")
    .where({
      guild: guildId,
      event: eventId,
    })
    .first();
}

export async function deleteAllEventRolesForGuild(
  _: DataClient,
  guildId: string
): Promise<void> {
  await db("eventRole").where("guild", guildId).delete();
}

async function createEventRole(
  bot: DataClient,
  event: GuildScheduledEvent
): Promise<EventRole> {
  const role = await createRoleForEvent(bot, event);

  return await db("eventRole").insert({
    guild: event.guild.id,
    role: role.id,
    event: event.id,
  });
}

export async function queueCreateEventRole(
  bot: DataClient,
  event: GuildScheduledEvent
): Promise<EventRole> {
  const { data } = await getQueue(event.id).push(
    async () => await createEventRole(bot, event),
    3
  );

  return data;
}

export async function queueUpdateEventRole(
  bot: DataClient,
  event: GuildScheduledEvent
): Promise<void> {
  await getQueue(event.id).push(async () => {
    let dbo = await getEventRole(bot, event.guild.id, event.id);

    if (!dbo) {
      dbo = await createEventRole(bot, event);
    }

    await bot.editRole(event.guild.id, dbo.role, {
      name: event.name,
    });
  });
}

export async function queueDeleteEventRole(
  bot: DataClient,
  event: GuildScheduledEvent
): Promise<void> {
  await getQueue(event.id).push(async () => {
    const dbo = await getEventRole(bot, event.guild.id, event.id);

    if (!dbo) {
      return;
    }

    await db("eventRole").where("id", dbo.id).delete();
    await deleteRoleAndIgnoreUnknown(bot, event.guild.id, dbo.role);
  }, 3);
}

export async function handleGuildCreate(
  bot: DataClient,
  guildId: string
): Promise<void> {
  const oldDbos = await getAllEventRoleDboForGuild(bot, guildId);
  await Promise.all(
    oldDbos.map(async (dbo) => {
      await db("eventRole").where("id", dbo.id).delete();
    })
  );

  const settings = await bot.dbm.newQuery("guild").get(guildId);

  if (!settings?.get("events")) {
    return;
  }

  const currentEvents = await bot.getGuildScheduledEvents(guildId);
  await Promise.all(
    currentEvents.map(async (event) => {
      const dbo = await createEventRole(bot, event);

      const users = await event.getUsers();
      await Promise.all(
        users.map(async ({ user }) => {
          await addRole(bot, guildId, user.id, dbo.role);
        })
      );
    })
  );
}

export async function handleStartup(
  bot: DataClient
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
): Promise<void[]> {
  return await Promise.all(
    bot.guilds.map(async (guild) => {
      const settings = await bot.dbm.newQuery("guild").get(guild.id);
      const existingDbos = await getAllEventRoleDboForGuild(bot, guild.id);

      if (!settings?.get("events")) {
        if (existingDbos.length > 0) {
          await Promise.all(
            existingDbos.map(async (dbo) => {
              await deleteRoleAndIgnoreUnknown(bot, guild.id, dbo.role);
              await db("eventRole").where("id", dbo.id).delete();
            })
          );
        }
        return;
      }

      const currentEvents = await bot.getGuildScheduledEvents(guild.id);

      await Promise.all([
        ...currentEvents.map(async (event) => {
          if (!existingDbos.some((dbo) => dbo.event === event.id)) {
            const [dbo, users] = await Promise.all([
              createEventRole(bot, event),
              event.getUsers(),
            ]);

            await Promise.all(
              users.map(async ({ user }) => {
                await addRole(bot, guild.id, user.id, dbo.role);
              })
            );
          }
        }),
        ...existingDbos.map(async (dbo) => {
          const { role: roleId, event: eventId } = dbo;

          const event = currentEvents.find((event) => event.id === eventId);

          if (event) {
            const membersWithRole = guild.members.filter((member) =>
              member.roles.includes(roleId)
            );
            const membersWhoNeedRole = await event.getUsers();

            await Promise.all([
              bot.editRole(guild.id, roleId, {
                name: event.name,
              }),
              ...membersWithRole
                .filter(
                  (member) =>
                    !membersWhoNeedRole.some(
                      ({ user }) => user.id === member.id
                    )
                )
                .map(async ({ id: memberId }) => {
                  await bot.removeGuildMemberRole(guild.id, memberId, roleId);
                }),
              ...membersWhoNeedRole
                .filter(
                  ({ user }) =>
                    !membersWithRole.some((member) => user.id === member.id)
                )
                .map(async ({ user }) => {
                  await bot.addGuildMemberRole(guild.id, user.id, roleId);
                }),
            ]);
          } else {
            await deleteRoleAndIgnoreUnknown(bot, guild.id, dbo.role);
            await db("eventRole").where("id", dbo.id).delete();
          }
        }),
      ]);
    })
  );
}

export async function handleEventRoleDeleted(
  bot: DataClient,
  guild: Guild,
  role: Role
): Promise<void> {
  // const settings = await bot.dbm.newQuery("guild").get(guild.id);
  const settings = await db("guild").where("id", guild.id).first();

  if (!settings?.events) {
    return;
  }

  const dbo = await getEventRole(bot, guild.id, role.id);

  if (dbo) {
    const newRole = await createRoleForEvent(
      bot,
      await guild.getRESTScheduledEvent(dbo.event)
    );

    await db("eventRole").where("id", dbo.id).update({ role: newRole.id });
  }
}

export async function addUserToEventRole(
  bot: DataClient,
  guildId: string,
  memberId: string,
  eventId: string
): Promise<void> {
  await getQueue(eventId).push(async () => {
    const eventRole = await getEventRole(bot, guildId, eventId);

    if (!eventRole) {
      return;
    }

    await bot.addGuildMemberRole(guildId, memberId, eventRole.role);
  }, 2);
}

export async function removeUserFromEventRole(
  bot: DataClient,
  guildId: string,
  memberId: string,
  eventId: string
): Promise<void> {
  await getQueue(eventId).push(async () => {
    const eventRole = await getEventRole(bot, guildId, eventId);

    if (!eventRole) {
      return;
    }

    await removeRole(bot, guildId, memberId, eventRole.role);
  }, 2);
}
