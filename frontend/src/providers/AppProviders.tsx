import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { buildTheme } from '../theme';

const ThemeModeContext = createContext<{ mode: 'light' | 'dark'; toggleMode: () => void }>({
  mode: 'light',
  toggleMode: () => undefined
});

export const useThemeMode = () => useContext(ThemeModeContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export default function AppProviders({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('erp-theme-mode');
    return stored === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('erp-theme-mode', mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => setMode((current) => (current === 'light' ? 'dark' : 'light'))
    }),
    [mode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeContext.Provider value={value}>
        <ThemeProvider theme={buildTheme(mode)}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </QueryClientProvider>
  );
}
