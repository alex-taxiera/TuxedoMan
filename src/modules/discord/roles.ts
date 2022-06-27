import {
  Collection,
  Member,
} from '@alex-taxiera/eris'
import { DataClient } from 'eris-boiler'
import { logger } from 'eris-boiler/util'

const logSpacing = ' '.repeat(25)

export async function editRoles (
  member: Member,
  roleIds: string[],
): Promise<void> {
  if (
    member.roles.every((role) => roleIds.includes(role)) &&
    member.roles.length === roleIds.length
  ) {
    return
  }
  const removedRoles = member.roles.filter((id) => !roleIds.includes(id))
  const addedRoles = roleIds.filter((id) => !member.roles.includes(id))

  logger.info(
    `ROLE UPDATE FOR ${member.id} IN ${member.guild.id}\n${
      removedRoles.length > 0
        ? `${logSpacing}REMOVING: ${removedRoles.join(', ')}\n`
        : ''
    }${
      addedRoles.length > 0
        ? `${logSpacing}ADDING: ${
          roleIds.filter((id) => !member.roles.includes(id)).join(', ')
        }`
        : ''
    }`,
  )

  await member.edit({
    roles: roleIds,
  })
  member.roles = roleIds
}

export async function removeRole (
  bot: DataClient,
  guildId: string,
  memberId: string,
  roleId: string,
): Promise<void> {
  logger.info(`REMOVE ROLE ${roleId} FROM ${memberId} IN ${guildId}`)
  return await bot.removeGuildMemberRole(guildId, memberId, roleId)
}

export async function addRole (
  bot: DataClient,
  guildId: string,
  memberId: string,
  roleId: string,
): Promise<void> {
  logger.info(`ADD ROLE ${roleId} TO ${memberId} IN ${guildId}`)
  return await bot.addGuildMemberRole(guildId, memberId, roleId)
}

export function countMembersWithRole (
  members: Collection<Member> | Member[],
  roleId: string,
): number {
  return members.filter((member) => member.roles.includes(roleId)).length
}
