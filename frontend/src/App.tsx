import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AppShell from './components/AppShell';
import { authStorage } from './lib/auth';

const HomePage = lazy(() => import('@pages/HomePage'));
const PartnersPage = lazy(() => import('@pages/PartnersPage'));
const ProductsPage = lazy(() => import('@pages/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const PurchasesPage = lazy(() => import('@pages/PurchasesPage'));
const StockPage = lazy(() => import('@pages/StockPage'));
const SalesPage = lazy(() => import('@pages/SalesPage'));
const CashPage = lazy(() => import('@pages/CashPage'));
const UploadsPage = lazy(() => import('@pages/UploadsPage'));
const LoginPage = lazy(() => import('@pages/LoginPage'));

function RequireAuth({ children }: { children: ReactNode }) {
  return authStorage.isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: ReactNode }) {
  return authStorage.isAuthenticated() ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      }
    >
      <Routes>
        <Route
          path="/login"
          element={(
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          )}
        />

        <Route
          path="/*"
          element={(
            <RequireAuth>
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/partners" element={<PartnersPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/purchases" element={<PurchasesPage />} />
                  <Route path="/stock" element={<StockPage />} />
                  <Route path="/sales" element={<SalesPage />} />
                  <Route path="/cash" element={<CashPage />} />
                  <Route path="/uploads" element={<UploadsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </RequireAuth>
          )}
        />
      </Routes>
    </Suspense>
  );
}

export default App;
