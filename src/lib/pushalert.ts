/**
 * PushAlert REST API: send a push notification to all subscribers.
 * Requires PUSHALERT_API_KEY in env (from PushAlert dashboard).
 */

const PUSHALERT_SEND_URL = "https://api.pushalert.co/rest/v1/send"

export type SendPushOptions = {
  title: string
  message: string
  url: string
  icon?: string
}

export async function sendPushAlert(options: SendPushOptions): Promise<{ success: boolean; id?: number; error?: string }> {
  return sendPushAlertToSubscribers(options)
}

/** Send to a specific subscriber (for personalized daily summary). */
export async function sendPushAlertToSubscriber(
  subscriberId: string,
  options: SendPushOptions
): Promise<{ success: boolean; id?: number; error?: string }> {
  return sendPushAlertToSubscribers({ ...options, subscriber: subscriberId })
}

async function sendPushAlertToSubscribers(
  options: SendPushOptions & { subscriber?: string }
): Promise<{ success: boolean; id?: number; error?: string }> {
  const apiKey = process.env.PUSHALERT_API_KEY
  if (!apiKey) {
    return { success: false, error: "PUSHALERT_API_KEY not set" }
  }

  const body = new URLSearchParams({
    title: options.title.slice(0, 64),
    message: options.message.slice(0, 192),
    url: options.url,
    ...(options.icon && { icon: options.icon }),
    ...(options.subscriber && { subscriber: options.subscriber }),
  })

  const res = await fetch(PUSHALERT_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `api_key=${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  const data = (await res.json().catch(() => ({}))) as { success?: boolean; id?: number; msg?: string }
  if (data.success && data.id != null) {
    return { success: true, id: data.id }
  }
  return { success: false, error: (data as { msg?: string }).msg ?? `HTTP ${res.status}` }
}
