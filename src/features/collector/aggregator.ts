import type { CarStateSnapshot } from '../../shared/contracts/car-state-snapshot'
import { type CarStateEvent, convertSpeedToKmh } from './mqtt-parser'

export type CarStateAggregatorOptions = {
  carId: number
  batteryCount: number
  staleAfterMs: number
}

export type CarStateAggregator = {
  ingest(event: CarStateEvent, receivedAtMs: number): void
  createSnapshot(nowMs: number): CarStateSnapshot | null
  isStale(nowMs: number): boolean
  isComplete(): boolean
  hasReceivedTelemetry(): boolean
}

type LatestCarState = {
  latitude?: number
  longitude?: number
  speedMetersPerSecond?: number
  gear?: number
  batterySocByIndex: Map<number, number>
  batteryCapacityByIndex: Map<number, number>
  lastTelemetryAtMs?: number
}

export const createCarStateAggregator = (
  options: CarStateAggregatorOptions,
): CarStateAggregator => {
  const state: LatestCarState = {
    batterySocByIndex: new Map(),
    batteryCapacityByIndex: new Map(),
  }

  const ingest = (event: CarStateEvent, receivedAtMs: number): void => {
    if (event.carId !== options.carId) {
      return
    }

    state.lastTelemetryAtMs = receivedAtMs

    switch (event.kind) {
      case 'latitude':
        state.latitude = event.value
        return
      case 'longitude':
        state.longitude = event.value
        return
      case 'speed':
        state.speedMetersPerSecond = event.value
        return
      case 'gear':
        state.gear = event.value
        return
      case 'batterySoc':
        state.batterySocByIndex?.set(event.batteryIndex, event.value)
        return
      case 'batteryCapacity':
        state.batteryCapacityByIndex?.set(event.batteryIndex, event.value)
        return
    }
  }

  const createSnapshot = (nowMs: number): CarStateSnapshot | null => {
    if (!isComplete() || isStale(nowMs)) {
      return null
    }

    const { latitude, longitude, gear, speedMetersPerSecond } = state

    if (
      latitude === undefined ||
      longitude === undefined ||
      gear === undefined ||
      speedMetersPerSecond === undefined
    ) {
      return null
    }

    return {
      version: 1,
      carId: options.carId,
      time: new Date(nowMs).toISOString(),
      stateOfCharge: calculateWeightedCharge(),
      latitude,
      longitude,
      gear,
      speed: convertSpeedToKmh(speedMetersPerSecond),
    }
  }

  const isStale = (nowMs: number): boolean => {
    return (
      state.lastTelemetryAtMs === undefined ||
      nowMs - state.lastTelemetryAtMs > options.staleAfterMs
    )
  }

  const isComplete = (): boolean => {
    return (
      state.latitude !== undefined &&
      state.longitude !== undefined &&
      state.speedMetersPerSecond !== undefined &&
      state.gear !== undefined &&
      hasAllBatteryValues()
    )
  }

  const hasReceivedTelemetry = (): boolean => {
    return state.lastTelemetryAtMs !== undefined
  }

  const hasAllBatteryValues = (): boolean => {
    for (let batteryIndex = 0; batteryIndex < options.batteryCount; batteryIndex += 1) {
      if (
        state.batterySocByIndex.get(batteryIndex) === undefined ||
        state.batteryCapacityByIndex.get(batteryIndex) === undefined
      ) {
        return false
      }
    }

    return true
  }

  const calculateWeightedCharge = (): number => {
    let weightedChargeSum = 0
    let capacitySum = 0

    for (let batteryIndex = 0; batteryIndex < options.batteryCount; batteryIndex += 1) {
      const soc = state.batterySocByIndex.get(batteryIndex)
      const capacity = state.batteryCapacityByIndex.get(batteryIndex)

      if (soc === undefined || capacity === undefined) {
        throw new Error(`Battery ${batteryIndex} is missing SOC or capacity`)
      }

      weightedChargeSum += soc * capacity
      capacitySum += capacity
    }

    return Math.round(weightedChargeSum / capacitySum)
  }

  return {
    ingest,
    createSnapshot,
    isStale,
    isComplete,
    hasReceivedTelemetry,
  }
}
