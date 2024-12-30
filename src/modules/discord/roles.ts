import {
  Collection,
  Member,
} from '@alex-taxiera/eris'
import { DataClient } from 'eris-boiler'
import * as logger from '@util/logger'

export function hasRolePermission (
  bot: DataClient,
  guildId: string,
): boolean {
  return bot.guilds.get(guildId)
    ?.permissionsOf(bot.user.id)
    .has('manageRoles') ?? false
}

export async function editRoles (
  bot: DataClient,
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

  if (!hasRolePermission(bot, member.guild.id)) {
    logger.warn('FAILED TO UPDATE ROLES: MISSING MANAGE ROLES')
    return
  }

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

  if (!hasRolePermission(bot, guildId)) {
    logger.warn('FAILED TO REMOVE ROLE: MISSING MANAGE ROLES')
    return
  }

  return await bot.removeGuildMemberRole(guildId, memberId, roleId)
}

export async function addRole (
  bot: DataClient,
  guildId: string,
  memberId: string,
  roleId: string,
): Promise<void> {
  logger.info(`ADD ROLE ${roleId} TO ${memberId} IN ${guildId}`)

  if (!hasRolePermission(bot, guildId)) {
    logger.warn('FAILED TO ADD ROLE: MISSING MANAGE ROLES')
    return
  }

  return await bot.addGuildMemberRole(guildId, memberId, roleId)
}

export function countMembersWithRole (
  members: Collection<Member> | Member[],
  roleId: string,
): number {
  return members.filter((member) => member.roles.includes(roleId)).length
}
