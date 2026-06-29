import { describe, expect, it } from 'vitest'
import { createAppConfig } from '../../src/shared/config'

describe('createAppConfig', () => {
  it('rejects missing required values instead of using code defaults', () => {
    expect(() => createAppConfig({})).toThrow()
  })

  it('creates config from validated values', () => {
    expect(
      createAppConfig({
        MQTT_URL: 'mqtt://example.test:1883',
        MQTT_USERNAME: 'user',
        MQTT_PASSWORD: 'pass',
        RABBITMQ_URL: 'amqp://guest:guest@example.test:5672',
        RABBITMQ_QUEUE: 'custom_queue',
        RABBITMQ_PREFETCH: '25',
        DATABASE_URL: 'postgres://postgres:postgres@example.test:5432/postgres',
        CAR_ID: '1',
        BATTERY_COUNT: '2',
        SNAPSHOT_INTERVAL_MS: '10000',
        MQTT_STALE_AFTER_MS: '30000',
      }),
    ).toEqual({
      mqtt: {
        url: 'mqtt://example.test:1883',
        username: 'user',
        password: 'pass',
        topic: 'car/1/#',
      },
      rabbitmq: {
        url: 'amqp://guest:guest@example.test:5672',
        queueName: 'custom_queue',
        prefetch: 25,
      },
      database: {
        url: 'postgres://postgres:postgres@example.test:5432/postgres',
      },
      telemetry: {
        carId: 1,
        batteryCount: 2,
        snapshotIntervalMs: 10_000,
        staleAfterMs: 30_000,
      },
    })
  })

  it('rejects malformed config values', () => {
    expect(() =>
      createAppConfig({
        MQTT_URL: 'not-a-url',
        RABBITMQ_PREFETCH: '0',
        SNAPSHOT_INTERVAL_MS: 'not-a-number',
      }),
    ).toThrow()
  })
})
