import {
  Collection,
  Member,
} from 'eris'
import { logger } from 'eris-boiler/util'

export async function editRoles (
  member: Member,
  roleIds: Array<string>,
): Promise<void> {
  if (
    member.roles.every((role) => roleIds.includes(role)) &&
    member.roles.length === roleIds.length
  ) {
    return
  }

  logger.info(
    `ROLE UPDATE:\nREMOVED: ${
      member.roles.filter((id) => !roleIds.includes(id)).join(', ')
    }\nADDED: ${roleIds.filter((id) => !member.roles.includes(id)).join(', ')}`,
  )

  member.roles = roleIds
  await member.edit({
    roles: roleIds,
  })
}

export async function removeRole (member: Member, id: string): Promise<void> {
  if (member.roles.includes(id)) {
    logger.info(`REMOVE ROLE ${id} FROM ${member.id}`)
    return member.removeRole(id)
  }
}

export function addRole (member: Member, id: string): Promise<void> {
  logger.info(`ADD ROLE ${id} TO ${member.id}`)
  return member.addRole(id)
}

export function countMembersWithRole (
  members: Collection<Member> | Array<Member>,
  roleId: string,
): number {
  return members.filter((member) => member.roles.includes(roleId)).length
}
