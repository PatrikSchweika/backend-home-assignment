# AGENTS.md

## Architecture

This project uses a vertical-slice structure. Feature-specific behavior lives under `src/features`, while reusable cross-cutting code lives under `src/shared`.

- `src/features/collector`: MQTT telemetry parsing, aggregation, snapshot creation, and publishing.
- `src/features/writer`: RabbitMQ message handling and Postgres persistence for car-state snapshots.
- `src/shared/config.ts`: environment loading and Zod config validation.
- `src/shared/contracts`: shared message contracts between collector and writer.
- `src/shared/infrastructure`: generic MQTT, RabbitMQ, and database adapters only.

Keep business rules inside feature folders. Shared infrastructure should stay generic and not know about car telemetry.

## Libraries

- MQTT: `mqtt`
- RabbitMQ: `amqplib`
- Postgres query builder: `kysely`
- Postgres driver: `pg`
- Schema/config validation: `zod`
- Env-file loading: `dotenv`
- Tests: `vitest`
- Concurrent local workers: `concurrently`

## Runtime Notes

Config values come from `.env.local` or `.env`, then are validated with Zod. Do not add defaults directly in code.

Run services with:

```sh
docker-compose up -d
```

Run both workers with:

```sh
pnpm all
```

Run verification with:

```sh
pnpm biome
pnpm test
```
