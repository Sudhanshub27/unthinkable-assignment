import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { formatTimeAgo } from '../utils/formatters';
import { Bell, Megaphone, ClipboardList } from 'lucide-react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const navigate = useNavigate();

  async function fetchNotifications() {
    try {
      const res = await client.get('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 15000);
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  async function handleMarkAllAsRead() {
    try {
      await client.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }

  async function handleNotificationClick(item) {
    if (!item.is_read) {
      try {
        await client.patch(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }

    setIsOpen(false);

    if (item.complaint_id) {
      navigate('/complaints');
    } else if (item.notice_id) {
      navigate('/notices');
    }
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        className="w-9 h-9 rounded-lg border border-line bg-paper-card text-ink hover:bg-paper-hover flex items-center justify-center relative transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-clay-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center ring-2 ring-paper-card">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-paper-card border border-line rounded-xl shadow-card z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-line bg-paper flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-terracotta-400 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-terracotta-400 font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-line">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-ink-muted text-xs space-y-1">
                <Bell className="w-6 h-6 mx-auto opacity-40 mb-1" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 cursor-pointer flex items-start gap-3 transition-colors ${
                    item.is_read ? 'bg-paper-card hover:bg-paper-hover' : 'bg-terracotta-50/50 hover:bg-terracotta-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.type === 'important_notice'
                        ? 'bg-mustard-50 text-mustard-500'
                        : 'bg-terracotta-50 text-terracotta-400'
                    }`}
                  >
                    {item.type === 'important_notice' ? (
                      <Megaphone className="w-4 h-4" />
                    ) : (
                      <ClipboardList className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs truncate ${item.is_read ? 'font-medium text-ink' : 'font-bold text-ink'}`}>
                        {item.title}
                      </span>
                      {!item.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-terracotta-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-ink-muted line-clamp-2 mt-0.5 leading-snug">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-ink-muted mt-1 block">
                      {formatTimeAgo(item.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
