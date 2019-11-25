const GameManager = require('./GameManager.js.js')
const { DataClient, Logger } = require('eris-boiler')
/**
 * Class representing a DataClient.
 * @extends {DataClient}
 */
class TuxedoMan extends DataClient {
  /**
   * Create a client.
   * @param {Object}  config                         The bot config data.
   * @param {String}  config.token                   The bot token.
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
   * @param {Object}  config.ROLES                   The extra role names to use.
   * @param {String}  config.ROLES.gameRole          The Other Games role name.
   * @param {String}  config.ROLES.listenRole        The Listening role name.
   * @param {String}  config.ROLES.watchRole         The Watching role name.
   * @param {String}  config.ROLES.streamRole        The Streaming role name.
   * @param {Object}  options                        Same as Client.
   */
  constructor (options = {}) {
    super(options)
    /**
     * The GameManager.
     * @type {GameManager}
     */
    this.gm = new GameManager(Logger)
  }
}

module.exports = TuxedoMan
