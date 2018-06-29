const GameManager = require('./GameManager.js')
const Logger = require('../classes/Logger.js')
/**
 * Class representing a DataClient.
 * @extends {DataClient}
 */
class TuxedoMan extends require('../classes/DataClient.js') {
  /**
   * Create a client.
   * @param {Object}  config                         The bot config data.
   * @param {String}  config.TOKEN                   The bot token.
   * @param {Object}  config.DB_CREDENTIALS          The database credentials.
   * @param {String}  config.DB_CREDENTIALS.database The name of the database.
   * @param {String}  config.DB_CREDENTIALS.host     The host address of the server.
   * @param {String}  config.DB_CREDENTIALS.user     The username to login with.
   * @param {String}  config.DB_CREDENTIALS.password The password to login with.
   * @param {Object}  config.DEFAULT                 The bots default values.
   * @param {String}  config.DEFAULT.prefix          The default prefix.
   * @param {Boolean} config.DEFAULT.rotateStatus    The default for changing bot status.
   * @param {Object}  config.DEFAULT.status          The default bot status.
   * @param {String}  config.DEFAULT.status.name     The default bot status name.
   * @param {Number}  config.DEFAULT.status.type     The default bot status type.
   * @param {Boolean} config.DEFAULT.status.default  The boolean indicating to the database that this is the default status.
   * @param {Object}  options                        Same as Client.
   */
  constructor (config, options) {
    super(config, options)
    /**
     * The GameManager.
     * @type {GameManager}
     */
    this.gm = new GameManager(config.ROLES, Logger)
  }
}

module.exports = TuxedoMan
