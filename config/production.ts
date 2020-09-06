import {
  load
} from 'docker-secret-env'

load()

export default {
  ...process.env
}
