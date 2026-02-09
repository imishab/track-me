/**
 * Web notification helpers (used with PushAlert).
 * PushAlert is loaded via the unified script in layout; this file only handles permission UI.
 */

/** Request browser permission for web notifications. Returns the result. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied"
  }
  if (Notification.permission === "granted") return "granted"
  if (Notification.permission === "denied") return "denied"
  const result = await Notification.requestPermission()
  return result
}

/** Current notification permission status. */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) return null
  return Notification.permission
}
