import { useState, useEffect, useRef } from 'react';
import { Bell, Award, Package, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import api from '../api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'report' | 'swap' | 'reward' | 'emergency';
  isRead: boolean;
  timestamp: any;
}

const NotificationBell = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!userId) return;

    // Real-time listener for notifications
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.post('/notifications/mark-read', { notificationId: id });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'reward': return <Award color="#FF9933" size={18} />;
      case 'swap': return <Package color="#138808" size={18} />;
      case 'emergency': return <ShieldAlert color="#E63946" size={18} />;
      default: return <CheckCircle color="#0A192F" size={18} />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - new Date().getTime()) / 60000), 
      'minute'
    );
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', 
          border: 'none', 
          padding: '0.5rem', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center',
          position: 'relative',
          color: isOpen ? 'var(--primary-green)' : 'inherit'
        }}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: 'var(--danger-red)',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            border: '2px solid white'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '320px',
          background: 'white',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          marginTop: '0.5rem',
          zIndex: 1000,
          maxHeight: '450px',
          overflowY: 'auto',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h4>
            {unreadCount > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--primary-green)', fontWeight: 'bold' }}>{unreadCount} Unread</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#6B7280' }}>
                <Bell size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #F3F4F6',
                    background: notif.isRead ? 'white' : '#F0FDF4',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notif.isRead ? 'white' : '#F0FDF4'}
                >
                  {!notif.isRead && (
                    <div style={{ position: 'absolute', left: '0.5rem', top: '1.25rem', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-green)' }} />
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ marginTop: '0.25rem' }}>{getIcon(notif.type)}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: notif.isRead ? '500' : '700', fontSize: '0.9rem', color: 'var(--accent-blue)' }}>{notif.title}</p>
                      <p style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '0.85rem', color: '#4B5563', lineHeight: '1.4' }}>{notif.message}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#9CA3AF' }}>
                        <Clock size={12} />
                        {formatTime(notif.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--primary-green)', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
              View all activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
