import { useEffect, useState } from 'react';
import { Badge, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material';
import { subscribeNotifications, type NotificationItem } from '../lib/notifications';

export default function NotificationCenter() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeNotifications((notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 12));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <IconButton color="inherit" onClick={(event) => setAnchorEl(event.currentTarget)}>
        <Badge badgeContent={notifications.length} color="error">
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>🔔</span>
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {notifications.length === 0 ? (
          <MenuItem disabled>Sin notificaciones</MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem key={notification.id} sx={{ whiteSpace: 'normal', maxWidth: 360 }}>
              <Stack spacing={0.3}>
                <Typography variant="subtitle2">{notification.title}</Typography>
                <Typography variant="body2" color="text.secondary">{notification.message}</Typography>
              </Stack>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
