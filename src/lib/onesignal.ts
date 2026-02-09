declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: { init: (config: Record<string, unknown>) => Promise<void> }) => void | Promise<void>>;
  }
}

const ONE_SIGNAL_APP_ID = "unified_0279a5dc690001526219e4712e97c85d"

export const initOneSignal = () => {
  if (typeof window === "undefined") return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId: ONE_SIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false,
      },
    });
  });
}

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
