import { Client } from '@stomp/stompjs'

export interface OrderCreatedEvent {
  orderId: number
  orderNumber: string
  email: string
  name: string
  total: number
  itemCount: number
}

export function useOrderSocket() {
  let client: Client | null = null

  const connect = (onOrderCreated: (event: OrderCreatedEvent) => void) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    client = new Client({
      brokerURL: `${protocol}//${window.location.host}/ws`,
      reconnectDelay: 5000,
      onConnect: () => {
        client?.subscribe('/topic/orders', (message) => {
          try {
            onOrderCreated(JSON.parse(message.body))
          } catch (e) {
            // Ignore malformed messages
          }
        })
      }
    })
    client.activate()
  }

  const disconnect = () => {
    client?.deactivate()
    client = null
  }

  return { connect, disconnect }
}
