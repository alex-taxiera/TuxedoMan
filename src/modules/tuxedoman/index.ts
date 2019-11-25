import {
  DataClient
} from 'eris-boiler'

import GameManager from '../game-manager'

export default class TuxedoMan extends DataClient {
  gm: GameManager = new GameManager()
}
