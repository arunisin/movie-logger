import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; gone?: boolean }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (err: unknown) {
    // 410 Gone = subscription expired/revoked, delete it
    if (
      err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      (err as { statusCode: number }).statusCode === 410
    ) {
      return { success: false, gone: true }
    }
    throw err
  }
}
