import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/types/notification';
import { useMarkAllNotifRead, useMarkNotifRead, useNotificationsQuery } from '@/hooks/queries/useNotificationQueries';
import { NotificationItem } from './NotificationItem';
import { Loading } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/EmptyState';

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const list = useNotificationsQuery();
  const markRead = useMarkNotifRead();
  const markAllRead = useMarkAllNotifRead();
  const navigate = useNavigate();

  const onClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n._id);
    if (n.taskId) {
      navigate(`/tasks?focus=${n.taskId}`);
      onClose();
    }
  };

  return (
    <div className="absolute right-0 top-12 z-40 w-80 rounded-3xl border border-border bg-surface p-2 shadow-md">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-sm font-semibold">Notifications</span>
        <button
          className="text-xs text-text-muted hover:text-text"
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-96 overflow-auto">
        {list.isLoading ? <Loading /> :
          list.data && list.data.length > 0 ? (
            <ul className="space-y-1 p-1">
              {list.data.map((n) => (
                <li key={n._id}><NotificationItem n={n} onClick={onClick} /></li>
              ))}
            </ul>
          ) : <EmptyState title="You're all caught up" />
        }
      </div>
    </div>
  );
}
