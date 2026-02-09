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
