import { DatabaseObject } from 'eris-boiler'
import { SettingCommand } from '@tuxedoman'
import { GameRole } from '@game-manager'

export const SETTING = 'voiceChannelThreshold'
export const DISPLAY_NAME = 'Voice User Threshold'
export const SETTING_DESCRIPTION =
  'Set the number of minimum players before making a voice room.'
export const SETTING_PARAMS = [
  'threshold number',
]

export function getValue (
  gameRole: GameRole,
): ReturnType<SettingCommand['getValue']> {
  return `${gameRole[SETTING] ?? 'Unset'}`
}

export async function setValue (
  params: Array<string>,
  dbo: DatabaseObject,
): Promise<ReturnType<SettingCommand['run']>> {
  const [ threshold ] = params

  await dbo.save({ [SETTING]: parseInt(threshold) })
  return 'Voice Room threshold set!'
}
