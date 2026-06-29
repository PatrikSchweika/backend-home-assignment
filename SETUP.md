# Setup

## Package Commands

Install dependencies:

```sh
pnpm install
```

Run the MQTT collector:

```sh
pnpm collector
```

Run the RabbitMQ-to-Postgres writer:

```sh
pnpm writer
```

Run collector and writer together:

```sh
pnpm all
```

Build the TypeScript project:

```sh
pnpm build
```

Run Biome linting and formatting checks:

```sh
pnpm biome
```

Apply safe Biome fixes:

```sh
pnpm biome:fix
```

Run unit tests:

```sh
pnpm test
```

## Environment Files

The application reads environment variables from the first existing file in this order:

1. `.env.local`
2. `.env`

Create `.env.local` for local development. Production deployments should usually provide these
values through the runtime environment or a secret manager instead of committing env files.

## Environment Variables

| Variable               | Required | Description                                                        | Local example                                           |
|------------------------|----------|--------------------------------------------------------------------|---------------------------------------------------------|
| `MQTT_URL`             | Yes      | MQTT broker connection URL.                                        | `mqtt://localhost:51883`                                |
| `MQTT_USERNAME`        | No       | MQTT username, if the broker requires authentication.              | `admin`                                                 |
| `MQTT_PASSWORD`        | No       | MQTT password, if the broker requires authentication.              | `admin`                                                 |
| `RABBITMQ_URL`         | Yes      | RabbitMQ AMQP connection URL.                                      | `amqp://admin:admin@localhost:55672`                    |
| `RABBITMQ_QUEUE`       | Yes      | Queue used for car state snapshot messages.                        | `car_state_snapshots`                                   |
| `RABBITMQ_PREFETCH`    | Yes      | Number of RabbitMQ messages the writer may process concurrently.   | `10`                                                    |
| `DATABASE_URL`         | Yes      | Postgres connection URL used by Kysely.                            | `postgres://postgres:postgres@localhost:55432/postgres` |
| `CAR_ID`               | Yes      | Car id to collect and aggregate.                                   | `1`                                                     |
| `BATTERY_COUNT`        | Yes      | Number of batteries expected for a complete car state snapshot.    | `2`                                                     |
| `SNAPSHOT_INTERVAL_MS` | Yes      | Collector snapshot publish interval in milliseconds.               | `5000`                                                  |
| `STALE_AFTER_MS`       | Yes      | Time without MQTT messages after which snapshot publishing pauses. | `15000`                                                 |

Numeric values are validated as positive integers. URLs, queue names, and snapshot payloads are
validated with Zod before they are used by the application.
