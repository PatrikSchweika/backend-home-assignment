import type { Kysely } from "kysely";
import type { CarStateSnapshot } from "../../shared/contracts/car-state-snapshot";
import type { Database } from "../../shared/infrastructure/database";

export const insertCarStateSnapshot = async (
  db: Kysely<Database>,
  snapshot: CarStateSnapshot,
): Promise<void> => {
  await db
    .insertInto("car_state")
    .values({
      car_id: snapshot.carId,
      time: snapshot.time,
      state_of_charge: snapshot.stateOfCharge,
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      gear: snapshot.gear,
      speed: snapshot.speed,
    })
    .executeTakeFirst();
};
