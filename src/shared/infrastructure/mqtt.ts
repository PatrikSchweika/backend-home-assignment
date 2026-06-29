import mqtt, { type IClientOptions, type MqttClient } from 'mqtt'

export type MqttSubscriber = {
  close(): Promise<void>
}

export type CreateMqttTelemetrySubscriberOptions = {
  url: string
  topic: string
  username?: string
  password?: string
  onMessage(topic: string, payload: Buffer): void
}

export const createMqttTelemetrySubscriber = async (
  options: CreateMqttTelemetrySubscriberOptions,
): Promise<MqttSubscriber> => {
  const clientOptions: IClientOptions = {
    username: options.username,
    password: options.password,
  }
  const client = mqtt.connect(options.url, clientOptions)

  await waitForConnect(client)
  await subscribe(client, options.topic)

  client.on('message', options.onMessage)

  return {
    close: () =>
      new Promise((resolve, reject) => {
        client.end(false, {}, (error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      }),
  }
}

const waitForConnect = (client: MqttClient): Promise<void> => {
  return new Promise((resolve, reject) => {
    client.once('connect', () => resolve())
    client.once('error', reject)
  })
}

const subscribe = (client: MqttClient, topic: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    client.subscribe(topic, { qos: 0 }, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}
