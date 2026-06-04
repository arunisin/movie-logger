"use client"

import { useState, useEffect, useRef } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

interface UsePushNotificationsReturn {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsLoading(false)
      return
    }

    setIsSupported(true)

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registrationRef.current = registration
        return registration.pushManager.getSubscription()
      })
      .then((subscription) => {
        setIsSubscribed(!!subscription)
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const subscribe = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      let registration = registrationRef.current
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js')
        registrationRef.current = registration
      }

      const res = await fetch('/api/push/vapid-public-key')
      const { publicKey } = await res.json()

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const subscriptionJson = subscription.toJSON()
      const p256dhBuffer = subscription.getKey('p256dh')
      const authBuffer = subscription.getKey('auth')

      if (!p256dhBuffer || !authBuffer) {
        throw new Error('Failed to get subscription keys')
      }

      const p256dh =
        subscriptionJson.keys?.p256dh ?? arrayBufferToBase64(p256dhBuffer)
      const auth =
        subscriptionJson.keys?.auth ?? arrayBufferToBase64(authBuffer)

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh,
          auth,
        }),
      })

      setIsSubscribed(true)
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async (): Promise<void> => {
    setIsLoading(true)
    try {
      let registration = registrationRef.current
      if (!registration) {
        registration = await navigator.serviceWorker.getRegistration('/sw.js') ?? null
        registrationRef.current = registration
      }

      if (!registration) return

      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        setIsSubscribed(false)
        return
      }

      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      })

      await subscription.unsubscribe()
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isSupported, isSubscribed, isLoading, subscribe, unsubscribe }
}
