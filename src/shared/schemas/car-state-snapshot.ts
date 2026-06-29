import { z } from 'zod'

export const CarStateSnapshotSchema = z.object({
  version: z.literal(1),
  carId: z.number(),
  time: z.iso.datetime(),
  stateOfCharge: z.number().int().min(0).max(100),
  latitude: z.number(),
  longitude: z.number(),
  gear: z.number().int().min(0).max(6),
  speed: z.number().nonnegative(),
})

export type CarStateSnapshot = z.infer<typeof CarStateSnapshotSchema>
