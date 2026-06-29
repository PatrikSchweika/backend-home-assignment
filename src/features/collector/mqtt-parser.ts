import { z } from 'zod'

export type CarStateEvent =
  | { kind: 'latitude'; carId: number; value: number }
  | { kind: 'longitude'; carId: number; value: number }
  | { kind: 'speed'; carId: number; value: number }
  | { kind: 'gear'; carId: number; value: number }
  | {
      kind: 'batterySoc'
      carId: number
      batteryIndex: number
      value: number
    }
  | {
      kind: 'batteryCapacity'
      carId: number
      batteryIndex: number
      value: number
    }

export const parseTelemetryMessage = (
  topic: string,
  payload: Buffer | string,
): CarStateEvent | null => {
  const parsedTopic = telemetryTopicSchema.safeParse(topic.trim().split('/'))

  if (!parsedTopic.success) {
    return null
  }

  const payloadValue = parsePayloadValue(payload)

  switch (parsedTopic.data.kind) {
    case 'latitude': {
      const value = numberPayloadSchema.safeParse(payloadValue)
      return value.success
        ? { kind: 'latitude', carId: parsedTopic.data.carId, value: value.data }
        : null
    }
    case 'longitude': {
      const value = numberPayloadSchema.safeParse(payloadValue)
      return value.success
        ? {
            kind: 'longitude',
            carId: parsedTopic.data.carId,
            value: value.data,
          }
        : null
    }
    case 'speed': {
      const value = speedPayloadSchema.safeParse(payloadValue)
      return value.success
        ? { kind: 'speed', carId: parsedTopic.data.carId, value: value.data }
        : null
    }
    case 'gear': {
      const value = gearPayloadSchema.safeParse(payloadValue)
      return value.success
        ? { kind: 'gear', carId: parsedTopic.data.carId, value: value.data }
        : null
    }
    case 'batterySoc': {
      const value = ChargePayloadSchema.safeParse(payloadValue)
      if (!value.success) {
        return null
      }

      return {
        kind: 'batterySoc',
        carId: parsedTopic.data.carId,
        batteryIndex: parsedTopic.data.batteryIndex,
        value: value.data,
      }
    }
    case 'batteryCapacity': {
      const value = batteryCapacityPayloadSchema.safeParse(payloadValue)
      if (!value.success) {
        return null
      }

      return {
        kind: 'batteryCapacity',
        carId: parsedTopic.data.carId,
        batteryIndex: parsedTopic.data.batteryIndex,
        value: value.data,
      }
    }
    default:
      return null
  }
}

export const convertSpeedToKmh = (speedMetersPerSecond: number): number => {
  return speedMetersPerSecond * 3.6
}

const payloadValueEnvelopeSchema = z.object({
  value: z.unknown(),
})

const parsePayloadValue = (payload: Buffer | string): unknown => {
  const payloadText = payload.toString().trim()

  try {
    const parsedPayload = JSON.parse(payloadText)
    const envelope = payloadValueEnvelopeSchema.safeParse(parsedPayload)

    return envelope.success ? envelope.data.value : payloadText
  } catch {
    return payloadText
  }
}

const numberPayloadSchema = z.coerce.number().refine((value) => Number.isFinite(value))

const speedPayloadSchema = numberPayloadSchema.gte(0)

const batteryCapacityPayloadSchema = numberPayloadSchema.gt(0)

const ChargePayloadSchema = numberPayloadSchema.gte(0).lte(100)

const gearPayloadSchema = z.union([
  z.literal('N').transform(() => 0),
  z.enum(['1', '2', '3', '4', '5', '6']).transform((value) => {
    return Number.parseInt(value, 10)
  }),
])

const topicIntegerStringSchema = z.coerce.number().int().nonnegative()

const locationTopicSchema = z
  .tuple([
    z.literal('car'),
    topicIntegerStringSchema,
    z.literal('location'),
    z.enum(['latitude', 'longitude']),
  ])
  .transform(([, carId, , locationKind]) => {
    return { kind: locationKind, carId }
  })

const scalarTopicSchema = z
  .tuple([z.literal('car'), topicIntegerStringSchema, z.enum(['speed', 'gear'])])
  .transform(([, carId, kind]) => {
    return { kind, carId }
  })

const batteryTopicSchema = z
  .tuple([
    z.literal('car'),
    topicIntegerStringSchema,
    z.literal('battery'),
    topicIntegerStringSchema,
    z.enum(['soc', 'capacity']),
  ])
  .transform(([, carId, , batteryIndex, batteryKind]) => {
    return {
      kind: batteryKind === 'soc' ? 'batterySoc' : 'batteryCapacity',
      carId,
      batteryIndex,
    }
  })

const telemetryTopicSchema = z.union([locationTopicSchema, scalarTopicSchema, batteryTopicSchema])
