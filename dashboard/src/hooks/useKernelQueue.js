import { useEffect, useRef, useState, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'

const HUB_URL = import.meta.env.VITE_HUB_URL

export function useKernelQueue() {
  const [snapshot, setSnapshot] = useState({ waiting: [], processing: [], completed: [] })
  const [connectionState, setConnectionState] = useState('Connecting')
  const hubRef = useRef(null)

  const connect = useCallback(async () => {
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect([0, 1000, 2000, 5000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    hub.on('QueueSnapshot', (data) => {
      setSnapshot({
        waiting:    data.waiting    ?? [],
        processing: data.processing ?? [],
        completed:  data.completed  ?? [],
      })
    })

    hub.onreconnecting(() => setConnectionState('Reconnecting'))
    hub.onreconnected(() => setConnectionState('Connected'))
    hub.onclose(() => setConnectionState('Disconnected'))

    try {
      await hub.start()
      setConnectionState('Connected')
      hubRef.current = hub
    } catch (err) {
      console.error('SignalR connection failed:', err)
      setConnectionState('Disconnected')
    }
  }, [])

  useEffect(() => {
    connect()
    return () => { hubRef.current?.stop() }
  }, [connect])

  const requestSnapshot = useCallback(async () => {
    if (hubRef.current?.state === signalR.HubConnectionState.Connected) {
      await hubRef.current.invoke('RequestSnapshot')
    }
  }, [])

  return { snapshot, connectionState, requestSnapshot }
}