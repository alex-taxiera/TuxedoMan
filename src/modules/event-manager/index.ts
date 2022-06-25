import { TuxedoMan } from '@tuxedoman'
import { DatabaseObject } from 'eris-boiler'
import { GuildScheduledEvent } from 'eris'
import { PriorityJobQueue } from '@util/job-queue'

export interface EventRole {
  id: string
  role: string
  guild: string
}
export default class EventManager {

  private readonly multiQueue = new Map<string, PriorityJobQueue>()

  private getQueue (eventId: string): PriorityJobQueue {
    if (!this.multiQueue.has(eventId)) {
      this.multiQueue.set(eventId, new PriorityJobQueue(3))
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.multiQueue.get(eventId)!
  }

  public async createEventRole (
    bot: TuxedoMan,
    event: GuildScheduledEvent,
  ): Promise<DatabaseObject> {
    const queue = this.getQueue(event.id)

    return await queue.push(async () => {
      const role = await bot.createRole(event.guild.id, {
        name: event.name,
        permissions: 0,
        mentionable: true,
      })

      return await bot.dbm.newObject('eventRole', {
        guild: event.guild.id,
        role: role.id,
        event: event.id,
      }).save()
    }, 3)
  }

  public async updateEventRole (
    bot: TuxedoMan,
    event: GuildScheduledEvent,
  ): Promise<void> {
    const queue = this.getQueue(event.id)

    await queue.push(async () => {
      const dbo = await this.getEventRoleDbo(bot, event.guild.id, event.id)

      if (!dbo) {
        return
      }

      await bot.editRole(event.guild.id, dbo.get('role'), {
        name: event.name,
      })
    })
  }

  public async deleteEventRole (
    bot: TuxedoMan,
    event: GuildScheduledEvent,
  ): Promise<void> {
    const queue = this.getQueue(event.id)

    await queue.push(async () => {
      const dbo = await this.getEventRoleDbo(bot, event.guild.id, event.id)

      if (!dbo) {
        return
      }

      await dbo.delete()
      await bot.deleteRole(event.guild.id, dbo.get('role'))
    }, 3)
  }

  public async addUserToEventRole (
    bot: TuxedoMan,
    guildId: string,
    memberId: string,
    eventId: string,
  ): Promise<void> {
    const queue = this.getQueue(eventId)

    await queue.push(async () => {
      const eventRole = await this.getEventRole(bot, guildId, eventId)

      if (!eventRole) {
        return
      }

      await bot.addGuildMemberRole(guildId, memberId, eventRole.role)
    }, 2)
  }

  public async removeUserFromEventRole (
    bot: TuxedoMan,
    guildId: string,
    memberId: string,
    eventId: string,
  ): Promise<void> {
    const queue = this.getQueue(eventId)
    await queue.push(async () => {
      const eventRole = await this.getEventRole(bot, guildId, eventId)

      if (!eventRole) {
        return
      }

      await bot.removeGuildMemberRole(guildId, memberId, eventRole.role)
    }, 2)
  }

  private async getEventRoleDbo (
    bot: TuxedoMan,
    guildId: string,
    eventId: string,
  ): Promise<DatabaseObject | undefined> {
    const [ dbo ] = await bot.dbm.newQuery('eventRole')
      .equalTo('guild', guildId)
      .equalTo('event', eventId)
      .limit(1)
      .find()

    return dbo
  }

  private async getEventRole (
    bot: TuxedoMan,
    guildId: string,
    roleId: string,
  ): Promise<EventRole | undefined> {
    const dbo = await this.getEventRoleDbo(bot, guildId, roleId)

    if (!dbo) {
      return undefined
    }

    return dbo.toJSON() as EventRole
  }

}
