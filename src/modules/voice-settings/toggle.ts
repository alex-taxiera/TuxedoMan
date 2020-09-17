import { DatabaseObject } from 'eris-boiler'
import { SettingCommand } from '@tuxedoman'
import { GameRole } from '@game-manager'

export const SETTING = 'manageVoice'
export const DISPLAY_NAME = 'Voice Rooms'
export const SETTING_DESCRIPTION = 'Toggle the voice room management.'

export function getValue (
  gameRole: GameRole,
): ReturnType<SettingCommand['getValue']> {
  return gameRole[SETTING] == null
    ? 'Unset'
    : gameRole[SETTING]
      ? 'Enabled'
      : 'Disabled'
}

export async function setValue (
  dbo: DatabaseObject,
): Promise<ReturnType<SettingCommand['run']>> {
  await dbo.save({ [SETTING]: !dbo.get(SETTING) })
  return dbo.get(SETTING) ? 'Enabled!' : 'Disabled!'
}
