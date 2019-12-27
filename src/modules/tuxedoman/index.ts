import {
  DataClient,
  Command as BaseCommand,
  GuildCommand as BaseGuildCommand,
  PrivateCommand as BasePrivateCommand,
  CommandContext
} from 'eris-boiler'
import {
  admin,
  owner,
  vip,
  createGeneric
} from 'eris-boiler/permissions'

import GameManager from '../game-manager'
export class TuxedoMan extends DataClient {
  public readonly gm: GameManager = new GameManager()
}

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

export const permissions = {
  admin: createGeneric<TuxedoMan>(admin),
  owner: createGeneric<TuxedoMan>(owner),
  vip: createGeneric<TuxedoMan>(vip)
}
