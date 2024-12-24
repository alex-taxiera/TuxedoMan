import type {
  Collection,
  Member,
} from '@alex-taxiera/eris'
import type { DataClient } from 'eris-boiler'
import * as logger from '@util/logger'

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

  const isRemoving = removedRoles.length > 0
  const isAdding = addedRoles.length > 0

  const metaText = `ROLE UPDATE FOR ${member.id} IN ${member.guild.id}:`
  const removeText = isRemoving ? ` REMOVING ${removedRoles.join(', ')}` : ''
  const andText = isRemoving && isAdding ? ' AND' : ''
  const addText = isAdding ? ` ADDING ${addedRoles.join(', ')}` : ''

  logger.info(`${metaText}${removeText}${andText}${addText}`)

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
  await bot.removeGuildMemberRole(guildId, memberId, roleId);
}

export async function addRole (
  bot: DataClient,
  guildId: string,
  memberId: string,
  roleId: string,
): Promise<void> {
  logger.info(`ADD ROLE ${roleId} TO ${memberId} IN ${guildId}`)
  await bot.addGuildMemberRole(guildId, memberId, roleId);
}

export function countMembersWithRole (
  members: Collection<Member> | Member[],
  roleId: string,
): number {
  return members.filter((member) => member.roles.includes(roleId)).length
}
