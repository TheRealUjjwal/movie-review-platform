import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

const WS_URL = window.location.protocol === 'https:'
  ? `wss://${window.location.hostname}:${window.location.port}`
  : `ws://${window.location.hostname}:5000`;

const NotificationToaster = () => {
  const { user } = useSelector(state => state.user);
  const wsRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user || !user.id) return;
    let ws;
    try {
      ws = new window.WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ userId: user.id }));
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'review') {
            setNotifications(n => [
              {
                id: Date.now() + Math.random(),
                message: `New review posted for a movie in your watchlist!`,
                movieId: data.movieId,
                review: data.review,
              },
              ...n.slice(0, 4)
            ]);
          }
        } catch {}
      };
    } catch {}
    return () => { if (ws) ws.close(); };
  }, [user]);

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
      {notifications.map(n => (
        <div key={n.id} style={{ background: '#232526', color: '#ffb400', padding: '1rem 1.5rem', borderRadius: 8, boxShadow: '0 2px 8px #0008', marginBottom: 12, minWidth: 260 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{n.message}</div>
          {n.review && (
            <div style={{ color: '#eee', fontSize: '0.97em' }}>
              <b>Rating:</b> {n.review.rating} <br />
              <b>Review:</b> {n.review.reviewText}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationToaster;
