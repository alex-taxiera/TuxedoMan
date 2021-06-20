import {
  DataClient,
  DiscordEvent as BaseDiscordEvent,
  Command as BaseCommand,
  GuildCommand as BaseGuildCommand,
  PrivateCommand as BasePrivateCommand,
  SettingCommand as BaseSettingCommand,
  ToggleCommand as BaseToggleCommand,
  CommandContext,
  GuildCommandContext,
} from 'eris-boiler'

import GameManager from '@game-manager'
import { logger } from 'eris-boiler/util'
export class TuxedoMan extends DataClient {

  public readonly gm: GameManager = new GameManager()

  public static checkVoicePostHook (
    bot: TuxedoMan,
    { msg }: Pick<GuildCommandContext, 'msg'>,
  ): void {
    bot.gm.checkVoiceForGuild(bot, msg.channel.guild)
      .catch((error: Error) => logger.error(error, error.stack))
  }

}

export class DiscordEvent<
  T extends DataClient = TuxedoMan
> extends BaseDiscordEvent<T> {}
export class Command<
  C extends CommandContext = CommandContext,
  T extends DataClient = TuxedoMan
> extends BaseCommand<T, C> {}
export class GuildCommand<
  T extends DataClient = TuxedoMan
> extends BaseGuildCommand<T> {}
export class PrivateCommand<
  T extends DataClient = TuxedoMan
> extends BasePrivateCommand<T> {}
export class SettingCommand<
  T extends DataClient = TuxedoMan
> extends BaseSettingCommand<T> {}
export class ToggleCommand<
  T extends DataClient = TuxedoMan
> extends BaseToggleCommand<T> {}
