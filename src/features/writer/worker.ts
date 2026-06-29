import { z } from 'zod'
import { loadAppConfig } from '../../shared/config'
import { CarStateSnapshotSchema } from '../../shared/contracts/car-state-snapshot'
import { createDatabase } from '../../shared/infrastructure/database'
import { createRabbitMqConsumer } from '../../shared/infrastructure/rabbitmq'
import { insertCarStateSnapshot } from './repository'

export const worker = async (): Promise<void> => {
  const appConfig = loadAppConfig()
  const db = createDatabase(appConfig.database.url)

  const consumer = await createRabbitMqConsumer({
    url: appConfig.rabbitmq.url,
    queueName: appConfig.rabbitmq.queueName,
    prefetch: appConfig.rabbitmq.prefetch,
    handleMessage: async (content) => {
      let parsedPayload: unknown

      console.info('Received car state snapshot')

      try {
        parsedPayload = JSON.parse(content.toString('utf8'))
      } catch (error) {
        console.warn('Rejecting malformed JSON message', error)
        return 'reject'
      }

      const parseResult = CarStateSnapshotSchema.safeParse(parsedPayload)

      if (!parseResult.success) {
        console.warn('Rejecting invalid car state snapshot', z.treeifyError(parseResult.error))
        return 'reject'
      }

      try {
        console.info(
          `Inserting car state snapshot ${parseResult.data.carId} into DB`,
          parseResult.data,
        )
        await insertCarStateSnapshot(db, parseResult.data)
        return 'ack'
      } catch (error) {
        console.error('Database insert failed; requeueing message', error)
        return 'requeue'
      }
    },
  })

  const shutdown = async (): Promise<void> => {
    await consumer.close()
    await db.destroy()
  }

  process.once('SIGINT', () => {
    shutdown().finally(() => process.exit(0))
  })
  process.once('SIGTERM', () => {
    shutdown().finally(() => process.exit(0))
  })

  console.info(`Writer consuming ${appConfig.rabbitmq.queueName}`)
}
