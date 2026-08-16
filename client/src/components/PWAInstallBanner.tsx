import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { X, Download, Bell, BellOff, Smartphone } from 'lucide-react';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('pwa-banner-dismissed') === 'true';
  });
  const [notifDismissed, setNotifDismissed] = useState(() => {
    return localStorage.getItem('notif-banner-dismissed') === 'true';
  });

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setDismissed(true);
  };

  const handleNotifDismiss = () => {
    localStorage.setItem('notif-banner-dismissed', 'true');
    setNotifDismissed(true);
  };

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) handleDismiss();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col gap-2 p-3 pointer-events-none">
      {/* Install App Banner */}
      {isInstallable && !isInstalled && !dismissed && (
        <div className="pointer-events-auto bg-gradient-to-r from-green-700 to-green-600 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 mx-auto w-full max-w-md">
          <Smartphone className="h-8 w-8 flex-shrink-0 text-green-200" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Install Academy App</p>
            <p className="text-xs text-green-200 truncate">Add to home screen for the best experience</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-green-700 hover:bg-green-50 text-xs px-3 h-8"
              onClick={handleInstall}
            >
              <Download className="h-3 w-3 mr-1" />
              Install
            </Button>
            <button onClick={handleDismiss} className="text-green-200 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Push Notification Banner */}
      {isSupported && !isSubscribed && !notifDismissed && (
        <div className="pointer-events-auto bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 mx-auto w-full max-w-md">
          <Bell className="h-8 w-8 flex-shrink-0 text-blue-200" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Enable Notifications</p>
            <p className="text-xs text-blue-200 truncate">Get alerts for goals, badges &amp; media tags</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-blue-50 text-xs px-3 h-8"
              onClick={subscribe}
              disabled={isLoading}
            >
              <Bell className="h-3 w-3 mr-1" />
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
            <button onClick={handleNotifDismiss} className="text-blue-200 hover:text-white p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notification toggle when subscribed */}
      {isSupported && isSubscribed && (
        <div className="pointer-events-auto bg-green-800/90 text-white rounded-xl shadow-lg p-3 flex items-center gap-3 mx-auto w-full max-w-md">
          <Bell className="h-5 w-5 text-green-700 dark:text-green-300 flex-shrink-0" />
          <p className="flex-1 text-xs text-green-200">Push notifications are active on this device</p>
          <button
            onClick={unsubscribe}
            disabled={isLoading}
            className="text-green-700 dark:text-green-300 hover:text-white text-xs flex items-center gap-1"
          >
            <BellOff className="h-3 w-3" />
            Mute
          </button>
        </div>
      )}
    </div>
  );
}
