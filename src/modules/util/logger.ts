import { logger } from 'eris-boiler/util'
import * as Sentry from '@sentry/node'

export const error = (error: Error): void => {
  logger.error(error, error.stack)
  Sentry.captureException(error)
}

export const info = (message: string): void => {
  logger.info(message)
}

export const warn = (message: string): void => {
  logger.warn(message)
}
