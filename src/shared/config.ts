import { type DotenvParseOutput, config as loadDotenv } from 'dotenv'
import { z } from 'zod'

const positiveIntegerEnv = z.coerce.number().int().positive()

const EnvConfigSchema = z
  .object({
    MQTT_URL: z.url(),
    MQTT_USERNAME: z.string().optional(),
    MQTT_PASSWORD: z.string().optional(),

    RABBITMQ_URL: z.url(),
    RABBITMQ_QUEUE: z.string().min(1),
    RABBITMQ_PREFETCH: positiveIntegerEnv,
    DATABASE_URL: z.url(),

    CAR_ID: positiveIntegerEnv,
    BATTERY_COUNT: positiveIntegerEnv,
    SNAPSHOT_INTERVAL_MS: positiveIntegerEnv,
    MQTT_STALE_AFTER_MS: positiveIntegerEnv,
  })
  .loose()

export interface AppConfig {
  mqtt: {
    url: string
    username?: string
    password?: string
    topic: string
  }
  rabbitmq: {
    url: string
    queueName: string
    prefetch: number
  }
  database: {
    url: string
  }
  telemetry: {
    carId: number
    batteryCount: number
    snapshotIntervalMs: number
    staleAfterMs: number
  }
}

export const createAppConfig = (env: DotenvParseOutput): AppConfig => {
  const parsedEnv = EnvConfigSchema.parse(env)

  return {
    mqtt: {
      url: parsedEnv.MQTT_URL,
      username: parsedEnv.MQTT_USERNAME,
      password: parsedEnv.MQTT_PASSWORD,
      topic: `car/${parsedEnv.CAR_ID}/#`,
    },
    rabbitmq: {
      url: parsedEnv.RABBITMQ_URL,
      queueName: parsedEnv.RABBITMQ_QUEUE,
      prefetch: parsedEnv.RABBITMQ_PREFETCH,
    },
    database: {
      url: parsedEnv.DATABASE_URL,
    },
    telemetry: {
      carId: parsedEnv.CAR_ID,
      batteryCount: parsedEnv.BATTERY_COUNT,
      snapshotIntervalMs: parsedEnv.SNAPSHOT_INTERVAL_MS,
      staleAfterMs: parsedEnv.MQTT_STALE_AFTER_MS,
    },
  }
}

export const loadAppConfig = (): AppConfig => {
  const result = loadDotenv({
    path: ['.env.local', '.env'],
  })

  if (result.error !== undefined || result.parsed === undefined) {
    throw new Error('Config file not found')
  }

  return createAppConfig(result.parsed)
}
