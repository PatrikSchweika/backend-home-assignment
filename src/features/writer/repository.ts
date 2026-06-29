import type { Kysely } from 'kysely'
import type { Database } from '../../shared/infrastructure/database'
import type { CarStateSnapshot } from '../../shared/schemas/car-state-snapshot'

export const insertCarStateSnapshot = async (
  db: Kysely<Database>,
  snapshot: CarStateSnapshot,
): Promise<void> => {
  await db
    .insertInto('car_state')
    .values({
      car_id: snapshot.carId,
      time: snapshot.time,
      state_of_charge: snapshot.stateOfCharge,
      latitude: snapshot.latitude,
      longitude: snapshot.longitude,
      gear: snapshot.gear,
      speed: snapshot.speed,
    })
    .executeTakeFirst()
}
