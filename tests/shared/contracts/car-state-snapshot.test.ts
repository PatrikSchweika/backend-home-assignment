import { describe, expect, it } from "vitest";
import { CarStateSnapshotSchema } from "../../../src/shared/contracts/car-state-snapshot";

describe("CarStateSnapshotSchema", () => {
  it("accepts a valid versioned car state snapshot", () => {
    expect(
      CarStateSnapshotSchema.parse({
        version: 1,
        carId: 1,
        time: "2026-06-29T12:00:00.000Z",
        stateOfCharge: 87,
        latitude: 50.087,
        longitude: 14.421,
        gear: 3,
        speed: 42.12,
      }),
    ).toEqual({
      version: 1,
      carId: 1,
      time: "2026-06-29T12:00:00.000Z",
      stateOfCharge: 87,
      latitude: 50.087,
      longitude: 14.421,
      gear: 3,
      speed: 42.12,
    });
  });

  it("rejects malformed transport payloads", () => {
    expect(() =>
      CarStateSnapshotSchema.parse({
        version: 2,
        carId: 1,
        time: "not-a-date",
        stateOfCharge: 120,
        latitude: 50.087,
        longitude: 14.421,
        gear: 9,
        speed: -1,
      }),
    ).toThrow();
  });
});
