import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { Bell, Mail, Calendar, X, ExternalLink } from "lucide-react";

interface Notification {
  id: string;
  type: "email" | "calendar";
  category: string;
  subject: string;
  sender: string;
  date: string;
  endDate?: string;
  snippet: string;
  read: boolean;
  link: string;
}

interface NotificationsPanelProps {
  userEmail: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const diffMin = Math.round(absDiffMs / 60000);
  const diffH = Math.round(absDiffMs / 3600000);
  const diffD = Math.round(absDiffMs / 86400000);

  if (diffMs > 0) {
    if (diffMin < 60) return `Em ${diffMin}min`;
    if (diffH < 24) return `Em ${diffH}h`;
    return `Em ${diffD}d`;
  } else {
    if (diffMin < 60) return `${diffMin}min atras`;
    if (diffH < 24) return `${diffH}h atras`;
    return `${diffD}d atras`;
  }
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ userEmail }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || !userEmail) return;
    setLoading(true);
    api
      .get(`/api/outlook/notifications?userEmail=${encodeURIComponent(userEmail)}`)
      .then((res) => setNotifications(res.data))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [open, userEmail]);

  const unreadCount = notifications.filter((n) => !n.read && !readIds.has(n.id)).length;

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const isRead = (n: Notification) => n.read || readIds.has(n.id);

  return (
    <div className="relative" ref={panelRef}>
      <button
        id="notifications-bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir notificacoes"
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-primary-200 transition-all duration-200 group"
      >
        <Bell
          className={`w-5 h-5 transition-colors duration-200 ${open ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notifications-panel-dropdown"
          className="absolute right-0 top-12 w-[380px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden notifications-dropdown"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50/60 to-indigo-50/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">Notificacoes</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Outlook - Microsoft 365</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Marcar tudo lido
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                  <Bell className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-500">Nenhuma notificacao</p>
                <p className="text-xs text-gray-400 mt-1">Tudo em dia por aqui!</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const read = isRead(notif);
                const isCalendar = notif.type === "calendar";
                const isFuture = new Date(notif.date) > new Date();
                return (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`flex gap-3.5 px-5 py-4 cursor-pointer transition-all duration-150 group ${
                      read ? "bg-white hover:bg-gray-50/80" : "bg-primary-50/30 hover:bg-primary-50/60"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                        isCalendar ? "bg-indigo-100 text-indigo-600" : "bg-primary-100 text-primary-600"
                      }`}
                    >
                      {isCalendar ? <Calendar className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!read && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />}
                          <span className={`text-xs font-black truncate ${read ? "text-gray-700" : "text-gray-900"}`}>
                            {notif.subject}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold shrink-0 ${isFuture ? "text-indigo-500" : "text-gray-400"}`}>
                          {formatRelativeDate(notif.date)}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {notif.category} - {notif.sender.split("<")[0].trim()}
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{notif.snippet}</p>
                      <a
                        href={notif.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Abrir no Outlook
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!loading && notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
              <a
                href="https://outlook.live.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Ver todas no Outlook
              </a>
            </div>
          )}
        </div>
      )}

      <style>{`
        .notifications-dropdown {
          animation: slideDownFade 0.18s ease-out;
        }
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPanel;