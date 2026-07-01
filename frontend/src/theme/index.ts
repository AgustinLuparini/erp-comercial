import { createTheme } from '@mui/material/styles';

export const buildTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#f8fafc' : '#111827',
        contrastText: mode === 'dark' ? '#111827' : '#ffffff'
      },
      secondary: {
        main: mode === 'dark' ? '#94a3b8' : '#64748b'
      },
      text: {
        primary: mode === 'dark' ? '#e5e7eb' : '#020817',
        secondary: mode === 'dark' ? '#94a3b8' : '#475569'
      },
      background: {
        default: mode === 'dark' ? '#0a0a0a' : '#fafafa',
        paper: mode === 'dark' ? '#111111' : '#ffffff'
      },
      divider: mode === 'dark' ? '#262626' : '#e2e8f0',
      success: {
        main: mode === 'dark' ? '#34d399' : '#16a34a'
      },
      warning: {
        main: mode === 'dark' ? '#fbbf24' : '#ca8a04'
      },
      error: {
        main: mode === 'dark' ? '#f87171' : '#dc2626'
      }
    },
    shape: {
      borderRadius: 10
    },
    typography: {
      fontFamily: ['"Plus Jakarta Sans"', '"Manrope"', '"Segoe UI"', 'sans-serif'].join(','),
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontWeight: 750, letterSpacing: '-0.02em' },
      h4: { fontWeight: 750, letterSpacing: '-0.01em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { fontWeight: 600 }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: mode === 'dark' ? '1px solid #262626' : '1px solid #e2e8f0',
            boxShadow: mode === 'dark' ? '0 1px 0 rgba(255,255,255,0.04)' : '0 1px 2px rgba(2, 8, 23, 0.05)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: mode === 'dark' ? '1px solid #262626' : '1px solid #e2e8f0',
            boxShadow: mode === 'dark' ? '0 1px 0 rgba(255,255,255,0.04)' : '0 1px 2px rgba(2, 8, 23, 0.05)'
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: mode === 'dark' ? '1px solid #262626' : '1px solid #e2e8f0'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            paddingInline: 14,
            boxShadow: 'none'
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          },
          outlined: {
            borderWidth: 1
          }
        }
      },
      MuiTextField: {
        defaultProps: {
          size: 'small'
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: mode === 'dark' ? '#121212' : '#ffffff'
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              fontWeight: 700,
              color: mode === 'dark' ? '#cbd5e1' : '#334155',
              backgroundColor: mode === 'dark' ? '#171717' : '#f8fafc'
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600
          }
        }
      }
    }
  });
