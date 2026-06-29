import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib'

export type RabbitMqPublisher = {
  publish(message: unknown): Promise<void>
  close(): Promise<void>
}

export type QueueMessageResult = 'ack' | 'reject' | 'requeue'

export type RabbitMqConsumer = {
  close(): Promise<void>
}

interface CreateRabbitMqPublisherParams {
  url: string
  queueName: string
}

export const createRabbitMqPublisher = async (
  options: CreateRabbitMqPublisherParams,
): Promise<RabbitMqPublisher> => {
  const connection = await amqp.connect(options.url)
  const channel = await connection.createChannel()

  await channel.assertQueue(options.queueName, { durable: true })

  return {
    publish: async (message: unknown): Promise<void> => {
      const payload = Buffer.from(JSON.stringify(message))
      const accepted = channel.sendToQueue(options.queueName, payload, {
        contentType: 'application/json',
        persistent: true,
      })

      if (!accepted) {
        console.warn('RabbitMQ write buffer is full; publish will rely on amqplib buffering.')
      }
    },
    close: () => closeRabbitMq(connection, channel),
  }
}

interface CreateRabbitMqConsumerParams {
  url: string
  queueName: string
  prefetch: number
  handleMessage(content: Buffer): Promise<QueueMessageResult>
}

export const createRabbitMqConsumer = async (
  options: CreateRabbitMqConsumerParams,
): Promise<RabbitMqConsumer> => {
  const connection = await amqp.connect(options.url)
  const channel = await connection.createChannel()

  await channel.assertQueue(options.queueName, { durable: true })
  await channel.prefetch(options.prefetch)

  await channel.consume(options.queueName, async (message) => {
    if (message === null) {
      return
    }

    const result = await processMessage(options.handleMessage, message)

    switch (result) {
      case 'ack':
        channel.ack(message)
        return
      case 'reject':
        channel.reject(message, false)
        return
      case 'requeue':
        channel.nack(message, false, true)
        return
    }
  })

  return {
    close: () => closeRabbitMq(connection, channel),
  }
}

const processMessage = async (
  handleMessage: (content: Buffer) => Promise<QueueMessageResult>,
  message: ConsumeMessage,
): Promise<QueueMessageResult> => {
  try {
    return await handleMessage(message.content)
  } catch (error) {
    console.error('Unexpected RabbitMQ message handling error', error)
    return 'requeue'
  }
}

const closeRabbitMq = async (connection: ChannelModel, channel: Channel): Promise<void> => {
  await channel.close()
  await connection.close()
}
