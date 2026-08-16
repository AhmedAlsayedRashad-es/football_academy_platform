import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: notifications = [] } = trpc.notifications.getNotifications.useQuery();
  // getUnreadCount returns { count: number } — extract the count safely
  const { data: unreadCountData } = trpc.notifications.getUnreadCount.useQuery();
  const unreadCount = typeof unreadCountData === 'number' ? unreadCountData : (unreadCountData as any)?.count ?? 0;
  const markAsRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.getNotifications.invalidate();
      utils.notifications.getUnreadCount.invalidate();
    },
    onError: () => {
      // Silently ignore — don't crash the component tree
    }
  });
  const handleNotificationClick = (notificationId: number, isRead: boolean | null) => {
    if (!isRead) {
      // Backend expects { id: number }
      markAsRead.mutate({ id: notificationId });
    }
  };
  const handleMarkAllAsRead = () => {
    // Mark each unread notification as read individually
    (notifications as any[])
      .filter((n: any) => !n.isRead)
      .forEach((n: any) => markAsRead.mutate({ id: n.id }));
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'alert':
        return '🚨';
      default:
        return '📢';
    }
  };
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto py-1 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        {(notifications as any[]).length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="py-1">
            {(notifications as any[]).map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => handleNotificationClick(notification.id, notification.isRead)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
