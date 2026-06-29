import { describe, expect, it } from 'vitest'
import { convertSpeedToKmh, parseCarStateEvent } from '../../../src/features/collector/mqtt-parser'

describe('parseTelemetryMessage', () => {
  it('parses documented car topics', () => {
    expect(parseCarStateEvent('car/1/location/latitude', '50.087')).toEqual({
      kind: 'latitude',
      carId: 1,
      value: 50.087,
    })
    expect(parseCarStateEvent('car/1/location/longitude', '14.421')).toEqual({
      kind: 'longitude',
      carId: 1,
      value: 14.421,
    })
    expect(parseCarStateEvent('car/1/speed', '12.5')).toEqual({
      kind: 'speed',
      carId: 1,
      value: 12.5,
    })
    expect(parseCarStateEvent('car/1/gear', 'N')).toEqual({
      kind: 'gear',
      carId: 1,
      value: 0,
    })
    expect(parseCarStateEvent('car/1/gear', '6')).toEqual({
      kind: 'gear',
      carId: 1,
      value: 6,
    })
    expect(parseCarStateEvent('car/1/battery/0/soc', '80')).toEqual({
      kind: 'batterySoc',
      carId: 1,
      batteryIndex: 0,
      value: 80,
    })
    expect(parseCarStateEvent('car/1/battery/1/capacity', '3000')).toEqual({
      kind: 'batteryCapacity',
      carId: 1,
      batteryIndex: 1,
      value: 3000,
    })
  })

  it('parses JSON value payloads from MQTT messages', () => {
    expect(parseCarStateEvent('car/1/location/latitude', '{"value":97.61843448287163}')).toEqual({
      kind: 'latitude',
      carId: 1,
      value: 97.61843448287163,
    })
    expect(parseCarStateEvent('car/1/speed', '{"value":12.5}')).toEqual({
      kind: 'speed',
      carId: 1,
      value: 12.5,
    })
    expect(parseCarStateEvent('car/1/gear', '{"value":"N"}')).toEqual({
      kind: 'gear',
      carId: 1,
      value: 0,
    })
    expect(parseCarStateEvent('car/1/battery/0/soc', '{"value":80}')).toEqual({
      kind: 'batterySoc',
      carId: 1,
      batteryIndex: 0,
      value: 80,
    })
  })

  it('returns null for unknown topics and invalid payloads', () => {
    expect(parseCarStateEvent('car/1/unknown', '1')).toBeNull()
    expect(parseCarStateEvent('car/not-a-number/speed', '1')).toBeNull()
    expect(parseCarStateEvent('car/1/speed', 'fast')).toBeNull()
    expect(parseCarStateEvent('car/1/gear', 'R')).toBeNull()
    expect(parseCarStateEvent('truck/1/speed', '1')).toBeNull()
  })
})

describe('telemetry conversions', () => {
  it('converts speed from meters per second to kilometers per hour', () => {
    expect(convertSpeedToKmh(10)).toBe(36)
  })
})
