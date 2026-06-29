import { loadAppConfig } from '../../shared/config'
import { CarStateSnapshotSchema } from '../../shared/contracts/car-state-snapshot'
import { createMqttTelemetrySubscriber } from '../../shared/infrastructure/mqtt'
import { createRabbitMqPublisher } from '../../shared/infrastructure/rabbitmq'
import { createCarStateAggregator } from './aggregator'
import { parseTelemetryMessage } from './mqtt-parser'

export const worker = async (): Promise<void> => {
  const appConfig = loadAppConfig()
  const aggregator = createCarStateAggregator({
    carId: appConfig.telemetry.carId,
    batteryCount: appConfig.telemetry.batteryCount,
    staleAfterMs: appConfig.telemetry.staleAfterMs,
  })
  const publisher = await createRabbitMqPublisher({
    url: appConfig.rabbitmq.url,
    queueName: appConfig.rabbitmq.queueName,
  })
  const subscriber = await createMqttTelemetrySubscriber({
    url: appConfig.mqtt.url,
    topic: appConfig.mqtt.topic,
    username: appConfig.mqtt.username,
    password: appConfig.mqtt.password,
    onMessage: (topic, payload) => {
      const event = parseTelemetryMessage(topic, payload)

      if (event === null) {
        return
      }

      aggregator.ingest(event, Date.now())
    },
  })
  let isPublishing = false
  let wasStale = false
  let isWaitingForTelemetry = false

  const interval = setInterval(async () => {
    if (isPublishing) {
      return
    }

    const nowMs = Date.now()
    const hasReceivedTelemetry = aggregator.hasReceivedTelemetry()
    const isStale = aggregator.isStale(nowMs)

    if (!hasReceivedTelemetry && !isWaitingForTelemetry) {
      console.info('Waiting for the first MQTT telemetry message.')
    }

    if (hasReceivedTelemetry && isWaitingForTelemetry) {
      console.info('MQTT telemetry received; snapshot publishing can start once state is complete.')
    }

    isWaitingForTelemetry = !hasReceivedTelemetry

    if (hasReceivedTelemetry && isStale && !wasStale) {
      console.warn('MQTT source is stale; snapshot publishing is paused.')
    }

    if (hasReceivedTelemetry && !isStale && wasStale) {
      console.info('MQTT source recovered; snapshot publishing resumed.')
    }

    wasStale = hasReceivedTelemetry && isStale

    const snapshot = aggregator.createSnapshot(nowMs)
    if (snapshot === null) {
      return
    }

    isPublishing = true
    try {
      const validatedSnapshot = CarStateSnapshotSchema.parse(snapshot)
      await publisher.publish(validatedSnapshot)
      console.info(`Published car state snapshot at ${validatedSnapshot.time}`)
    } catch (error) {
      console.error('Failed to publish car state snapshot', error)
    } finally {
      isPublishing = false
    }
  }, appConfig.telemetry.snapshotIntervalMs)

  const shutdown = async (): Promise<void> => {
    clearInterval(interval)
    await subscriber.close()
    await publisher.close()
  }

  process.once('SIGINT', () => {
    shutdown().finally(() => process.exit(0))
  })
  process.once('SIGTERM', () => {
    shutdown().finally(() => process.exit(0))
  })

  console.info(`Collector subscribed to ${appConfig.mqtt.topic}`)
}
