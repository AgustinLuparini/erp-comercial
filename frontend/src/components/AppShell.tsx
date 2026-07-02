import { useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationCenter from './NotificationCenter';
import GlobalSearchDialog from './GlobalSearchDialog';
import { useThemeMode } from '../providers/AppProviders';
import { authService } from '../services/authService';

const drawerWidth = 274;

const navItems = [
  { label: 'Dashboard', path: '/', badge: 'DB' },
  { label: 'Productos', path: '/products', badge: 'PR' },
  { label: 'Clientes / Proveedores', path: '/partners', badge: 'CP' },
  { label: 'Compras', path: '/purchases', badge: 'CO' },
  { label: 'Stock', path: '/stock', badge: 'ST' },
  { label: 'Ventas', path: '/sales', badge: 'VT' },
  { label: 'Caja', path: '/cash', badge: 'CX' }
  //{ label: 'Uploads', path: '/uploads', badge: 'UP' }
];

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { mode, toggleMode } = useThemeMode();

  const handleLogout = async () => {
    if (logoutLoading) return;

    setLogoutLoading(true);
    try {
      await authService.logout();
    } finally {
      setLogoutLoading(false);
      navigate('/login', { replace: true });
    }
  };

  const drawer = useMemo(() => (
    <Box sx={{ height: '100%', backgroundColor: 'background.paper', color: 'text.primary' }}>
      <Box sx={{ p: 2.5 }}>
        <Typography variant="h6" fontWeight={800}>ERP Comercial</Typography>
        <Typography variant="body2" color="text.secondary">Operacion y control</Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: 2,
              color: 'text.primary',
              '&.Mui-selected': {
                backgroundColor: 'action.selected',
                border: '1px solid',
                borderColor: 'divider'
              }
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: 40,
                '& span': {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '10px',
                  backgroundColor: 'action.hover',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em'
                }
              }}
            >
              <Box component="span">{item.badge}</Box>
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  ), [location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(10px)',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.default, 0.88)
              : alpha(theme.palette.background.default, 0.9),
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}>
            <Box component="span" sx={{ fontSize: 22, lineHeight: 1 }}>☰</Box>
          </IconButton>
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>
            {navItems.find((item) => item.path === location.pathname)?.label ?? 'ERP'}
          </Typography>
          <IconButton onClick={() => setSearchOpen(true)}>
            <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>⌕</Box>
          </IconButton>
          <NotificationCenter />
          <Button onClick={toggleMode}>
            {mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </Button>
          <Button color="inherit" variant="outlined" onClick={handleLogout} disabled={logoutLoading}>
            {logoutLoading ? 'Saliendo...' : 'Cerrar sesion'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, pt: 9, px: { xs: 1, sm: 2, md: 3 }, pb: 3 }}>
        {children}
      </Box>

      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
}
