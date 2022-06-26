import {
  Collection,
  Member,
} from 'eris'
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
    `ROLE UPDATE:\n${removedRoles.length > 0
      ? `${logSpacing}REMOVED: ${removedRoles.join(', ')}\n`
      : ''}${addedRoles.length > 0
      ? `${logSpacing}ADDED: ${
        roleIds.filter((id) => !member.roles.includes(id)).join(', ')
      }`
      : ''}`,
  )

  member.roles = roleIds
  await member.edit({
    roles: roleIds,
  })
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
