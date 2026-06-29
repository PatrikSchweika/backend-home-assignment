import { type ColumnType, type Generated, Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

type CarStateTable = {
  id: Generated<number>
  car_id: number
  time: ColumnType<Date, Date | string, never>
  state_of_charge: number
  latitude: number
  longitude: number
  gear: number
  speed: number
}

export type Database = {
  car_state: CarStateTable
}

export const createDatabase = (databaseUrl: string): Kysely<Database> => {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: databaseUrl,
      }),
    }),
  })
}
