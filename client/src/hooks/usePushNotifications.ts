import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/hooks/use-toast';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const subscribeMutation = trpc.notifications.subscribePush.useMutation();
  const unsubscribeMutation = trpc.notifications.unsubscribePush.useMutation();
  const testPushMutation = trpc.notifications.sendTestPush.useMutation();

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return;
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast({ title: 'Permission denied', description: 'Please allow notifications in your browser settings.', variant: 'destructive' });
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      const subJson = sub.toJSON() as any;
      await subscribeMutation.mutateAsync({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      });

      setIsSubscribed(true);
      toast({ title: '🔔 Notifications enabled', description: 'You will receive real-time alerts on this device.' });

      // Send a test push to confirm it works
      await testPushMutation.mutateAsync();
    } catch (err: any) {
      console.error('[Push] Subscribe failed:', err);
      toast({ title: 'Failed to enable notifications', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, subscribeMutation, testPushMutation]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeMutation.mutateAsync({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      toast({ title: 'Notifications disabled', description: 'You will no longer receive push notifications.' });
    } catch (err: any) {
      toast({ title: 'Failed to disable notifications', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribeMutation]);

  return { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe };
}
