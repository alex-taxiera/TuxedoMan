import { Guild } from 'eris'
import { DatabaseObject } from 'eris-boiler'
import { SettingCommand } from '@tuxedoman'
import { GameRole } from '@game-manager'

export const SETTING = 'voiceChannelCategory'
export const DISPLAY_NAME = 'Voice Channel Category'
export const SETTING_DESCRIPTION =
  'Set the category to create voice channels under.'
export const SETTING_PARAMS = [
  'category channel name/id/mention',
]

export function getValue (
  guild: Guild,
  gameRole: GameRole,
): ReturnType<SettingCommand['getValue']> {
  const channelId = gameRole[SETTING] ?? ''
  const channel = guild.channels.get(channelId)

  if (!channel) {
    return 'None'
  }

  return `${channel.name} (${channel.id})`
}

export async function setValue (
  guild: Guild,
  params: Array<string>,
  dbo: DatabaseObject,
): Promise<ReturnType<SettingCommand['run']>> {
  const [ channelId ] = params
  const fullParam = params.join(' ')

  const channel = guild.channels.get(channelId) ||
    guild.channels.find((c) => c.name === fullParam)

  if (!channel) {
    return `Could not find channel "${fullParam}"`
  } else if (channel.type !== 4) {
    return `Channel "${fullParam}" is not a category`
  }

  if (channel.id === dbo.get('voiceChannelCategory')) {
    return 'Voice Category is already set to that channel!'
  }

  await dbo.save({ [SETTING]: channel.id })
  return 'Voice Room Category set!'
}
