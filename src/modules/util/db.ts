import config from 'config'
import knex from 'knex';

const MIN_POOL_SIZE = 0;

const db = knex({
  client: config.get('DB_CLIENT'),
  connection: {
    database: config.get('DB_NAME'),
    user: config.has('DB_USER') ? config.get('DB_USER') : '',
    password: config.has('DB_PASS') ? config.get('DB_PASS') : '',
    host: config.has('DB_HOST') ? config.get('DB_HOST') : '',
  },
  pool: {
    min: MIN_POOL_SIZE,
  }
});

export default db;


declare module 'knex/types/tables' {
  interface Guild {
    id: string;
    prefix: string;
    vip: string;
    game: boolean;
    stream: boolean;
    listen: boolean;
    watch: boolean;
    events: boolean;
    created_at: string;
    updated_at: string;
  }

  type CommonRoleType = "playing" | "streaming" | "watching" | "listening";
  type TrackedRoleType = "game";

  interface Game {
    id: number;
    role: string;
    guild: string;
    name: string;
  }

  interface Role {
    id: number;
    role: string;
    guild: string;
  }

  type CommonRole = Role & {
    type: CommonRoleType;
  }

  type TrackedRole = Role & {
    type: TrackedRoleType
  }

  type AnyRole = CommonRole | TrackedRole;

  interface EventRole {
    id: number;
    role: string;
    guild: string;
    event: string;
  }

  interface Status {
    id: number;
    name: string;
    type: number;
  }

  interface Tables {
    guild: Guild;
    game: Game;
    role: AnyRole;
    eventRole: EventRole;
    status: Status;
  }
}
