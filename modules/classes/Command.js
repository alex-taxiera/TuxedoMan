module.exports = class Command {
  constructor (name, description, parameters, rank, hidden, execute) {
    this.name = name
    this.description = description
    this.parameters = parameters
    this.rank = rank
    this.hidden = hidden
    this.execute = execute
  }
}
