import { describe, expect, it } from 'vitest'
import { createCarStateAggregator } from '../../../src/features/collector/aggregator'
import type { CarStateEvent } from '../../../src/features/collector/mqtt-parser'

const baseEvents: CarStateEvent[] = [
  { kind: 'latitude', carId: 1, value: 50.087 },
  { kind: 'longitude', carId: 1, value: 14.421 },
  { kind: 'speed', carId: 1, value: 10 },
  { kind: 'gear', carId: 1, value: 3 },
  { kind: 'batterySoc', carId: 1, batteryIndex: 0, value: 80 },
  { kind: 'batteryCapacity', carId: 1, batteryIndex: 0, value: 1000 },
  { kind: 'batterySoc', carId: 1, batteryIndex: 1, value: 40 },
  { kind: 'batteryCapacity', carId: 1, batteryIndex: 1, value: 3000 },
]

describe('createCarStateAggregator', () => {
  it('withholds snapshots until the car state is complete', () => {
    const aggregator = createCarStateAggregator({
      carId: 1,
      batteryCount: 2,
      staleAfterMs: 15_000,
    })

    aggregator.add({ kind: 'latitude', carId: 1, value: 50.087 }, 1_000)

    expect(aggregator.createSnapshot(5_000)).toBeNull()
  })

  it('creates normalized snapshots with weighted state of charge', () => {
    const aggregator = createCarStateAggregator({
      carId: 1,
      batteryCount: 2,
      staleAfterMs: 15_000,
    })

    for (const event of baseEvents) {
      aggregator.add(event, 1_000)
    }

    expect(aggregator.createSnapshot(5_000)).toEqual({
      version: 1,
      carId: 1,
      time: '1970-01-01T00:00:05.000Z',
      stateOfCharge: 50,
      latitude: 50.087,
      longitude: 14.421,
      gear: 3,
      speed: 36,
    })
  })

  it('pauses snapshots while MQTT input is stale and resumes after fresh input', () => {
    const aggregator = createCarStateAggregator({
      carId: 1,
      batteryCount: 2,
      staleAfterMs: 15_000,
    })

    for (const event of baseEvents) {
      aggregator.add(event, 1_000)
    }

    expect(aggregator.createSnapshot(17_001)).toBeNull()

    aggregator.add({ kind: 'speed', carId: 1, value: 12 }, 18_000)

    expect(aggregator.createSnapshot(20_000)).toMatchObject({
      carId: 1,
      speed: 43.2,
    })
  })
})
