import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Assessment as AssessmentIcon,
  AttachMoney as AttachMoneyIcon,
  Cancel as CancelIcon,
  CreditScore as CreditScoreIcon,
  Inventory2 as Inventory2Icon,
  LocalShipping as LocalShippingIcon,
  Refresh as RefreshIcon,
  ReceiptLong as ReceiptLongIcon,
  ShowChart as ShowChartIcon,
  Storefront as StorefrontIcon
} from '@mui/icons-material';
import { reportService, type DashboardStats } from '../services/reportService';

const money = (value: number) => `$${value.toFixed(2)}`;

const resolveDashboardImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const apiOrigin = apiUrl.replace(/\/api\/?$/, '');
  return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
};

const metricTrend = {
  positive: {
    bg: 'rgba(22, 163, 74, 0.1)',
    border: 'rgba(22, 163, 74, 0.32)',
    text: '#15803d',
    iconBg: 'rgba(22, 163, 74, 0.14)'
  },
  negative: {
    bg: 'rgba(220, 38, 38, 0.1)',
    border: 'rgba(220, 38, 38, 0.32)',
    text: '#b91c1c',
    iconBg: 'rgba(220, 38, 38, 0.14)'
  }
} as const;

const metricValueFontSize = (value: string) => {
  // Referencia: que entre una cadena tipo "$0000000000.00" en una sola línea.
  const targetChars = 14;
  const length = Math.max(value.trim().length, 1);
  const baseMdRem = 1.55;
  const ratio = Math.min(1, targetChars / length);

  const mdRem = Math.max(0.8, Number((baseMdRem * ratio).toFixed(2)));
  const xsRem = Math.max(0.72, Number((mdRem - 0.14).toFixed(2)));

  return {
    xs: `${xsRem}rem`,
    md: `${mdRem}rem`,
    letterSpacing: length > targetChars ? '-0.04em' : '-0.02em'
  };
};

const MetricCard = ({
  title,
  value,
  helper,
  icon,
  trend = 'positive'
}: {
  title: string;
  value: string;
  helper?: string;
  icon: ReactNode;
  trend?: keyof typeof metricTrend;
}) => {
  const palette = metricTrend[trend];
  const valueFontSize = metricValueFontSize(value);

  return (
    <Card
      sx={{
        height: '100%',
        color: 'text.primary',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none'
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                letterSpacing: 0.25,
                textTransform: 'uppercase',
                fontSize: { xs: '0.78rem', md: '0.84rem' },
                lineHeight: 1.2
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                mt: 0.5,
                fontSize: { xs: valueFontSize.xs, md: valueFontSize.md },
                lineHeight: 1,
                letterSpacing: valueFontSize.letterSpacing,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'clip',
                fontVariantNumeric: 'tabular-nums',
                maxWidth: '100%',
                display: 'block'
              }}
            >
              {value}
            </Typography>
            {helper ? (
              <Typography
                variant="body2"
                sx={{
                  mt: 1,
                  color: 'text.secondary',
                  fontSize: { xs: '0.8rem', md: '0.95rem' },
                  lineHeight: 1.25
                }}
              >
                {helper}
              </Typography>
            ) : null}
          </Box>
          <Stack spacing={1} alignItems="flex-end">
            <Chip
              size="small"
              label={trend === 'positive' ? 'Positivo' : 'Negativo'}
              sx={{
                fontWeight: 700,
                backgroundColor: palette.bg,
                border: '1px solid',
                borderColor: palette.border,
                color: palette.text
              }}
            />
            <Box sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 2, backgroundColor: palette.iconBg, color: palette.text }}>
            {icon}
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

const LineChartPanel = ({
  title,
  subtitle,
  icon,
  items,
  color,
  metricLabel
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: Array<{ label: string; value: number }>;
  color: string;
  metricLabel: string;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hasData = items.length > 0;
  const max = Math.max(...items.map((item) => item.value), 1);
  const min = Math.min(...items.map((item) => item.value), 0);
  const range = Math.max(max - min, 1);
  const chartWidth = 320;
  const chartHeight = 170;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartPoints = hasData
    ? items.map((item, index) => {
        const x = (index / Math.max(items.length - 1, 1)) * (chartWidth - 24) + 12;
        const y = chartHeight - 12 - ((item.value - min) / range) * (chartHeight - 24);
      return { x, y, label: item.label, value: item.value };
      })
    : [];

  const points = chartPoints.map((point) => `${point.x},${point.y}`);

  const activePoint = activeIndex !== null ? chartPoints[activeIndex] : null;

  const formatTooltip = (label: string, value: number) => {
    return `Fecha: ${label} | ${metricLabel}: ${money(value)}`;
  };

  const latest = hasData ? items[items.length - 1] : null;

  return (
    <Paper
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: isDark ? 'background.paper' : 'background.paper'
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', backgroundColor: 'action.hover' }}>{icon}</Box>
        <Box>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
      </Stack>

      {hasData ? (
        <>
          <Box sx={{ height: 170, width: '100%', mb: 1.4, position: 'relative' }} onMouseLeave={() => setActiveIndex(null)}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="none" role="img" aria-label={title}>
              <line x1="12" y1={chartHeight - 12} x2={chartWidth - 12} y2={chartHeight - 12} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1" />
              <line x1="12" y1="12" x2="12" y2={chartHeight - 12} stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1" />
              <polyline fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" points={points.join(' ')} />
              {activePoint ? (
                <line
                  x1={activePoint.x}
                  y1="12"
                  x2={activePoint.x}
                  y2={chartHeight - 12}
                  stroke={color}
                  strokeOpacity="0.28"
                  strokeWidth="1.6"
                  strokeDasharray="4 4"
                />
              ) : null}
              {chartPoints.map((point, index) => {
                const isLast = index === points.length - 1;
                const isActive = index === activeIndex;
                return (
                  <circle
                    key={`${items[index].label}-${point.x},${point.y}`}
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 5.6 : isLast ? 4.4 : 3.2}
                    fill={isActive || isLast ? color : isDark ? '#0f172a' : '#ffffff'}
                    stroke={color}
                    strokeWidth={isActive ? 2.8 : isLast ? 2.4 : 1.8}
                  />
                );
              })}
              {chartPoints.map((point, index) => {
                const prevX = chartPoints[index - 1]?.x ?? 12;
                const nextX = chartPoints[index + 1]?.x ?? chartWidth - 12;
                const left = index === 0 ? 12 : (prevX + point.x) / 2;
                const right = index === chartPoints.length - 1 ? chartWidth - 12 : (point.x + nextX) / 2;

                return (
                  <rect
                    key={`hover-hit-${point.label}-${index}`}
                    x={left}
                    y={12}
                    width={Math.max(right - left, 10)}
                    height={chartHeight - 24}
                    fill="transparent"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseMove={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                  >
                    <title>{formatTooltip(point.label, point.value)}</title>
                  </rect>
                );
              })}
            </svg>
            {activePoint ? (
              <Paper
                elevation={4}
                sx={{
                  position: 'absolute',
                  left: `${(activePoint.x / chartWidth) * 100}%`,
                  top: `${Math.max(((activePoint.y - 12) / chartHeight) * 100, 8)}%`,
                  transform: 'translate(-50%, -105%)',
                  px: 1,
                  py: 0.7,
                  pointerEvents: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.2,
                  backgroundColor: 'background.paper',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
                  maxWidth: 230,
                  zIndex: 2
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.3 }}>
                  Fecha: {activePoint.label}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>
                  {metricLabel}: {money(activePoint.value)}
                </Typography>
              </Paper>
            ) : null}
          </Box>
          {latest ? (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary" noWrap>{latest.label}</Typography>
              <Typography variant="subtitle2" fontWeight={800}>{money(latest.value)}</Typography>
            </Stack>
          ) : null}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">Sin datos para mostrar.</Typography>
      )}
    </Paper>
  );
};

const DONUT_COLORS = ['#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#0891b2', '#db2777'];

const DonutChartPanel = ({
  title,
  subtitle,
  icon,
  items
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  items: Array<{ label: string; value: number }>;
}) => {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const hasData = total > 0;

  let accumulated = 0;
  const gradientStops = hasData
    ? items.map((item, index) => {
        const start = (accumulated / total) * 360;
        accumulated += item.value;
        const end = (accumulated / total) * 360;
        const color = DONUT_COLORS[index % DONUT_COLORS.length];
        return `${color} ${start}deg ${end}deg`;
      })
    : ['#cbd5e1 0deg 360deg'];

  return (
    <Paper sx={{ p: 2.5, height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', backgroundColor: 'action.hover' }}>{icon}</Box>
        <Box>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
      </Stack>

      {hasData ? (
        <Stack direction={{ xs: 'column', sm: 'row', md: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'center', sm: 'flex-start' }}>
          <Box
            sx={{
              width: 152,
              height: 152,
              borderRadius: '50%',
              background: `conic-gradient(${gradientStops.join(',')})`,
              position: 'relative',
              flexShrink: 0
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 24,
                borderRadius: '50%',
                backgroundColor: 'background.paper',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="subtitle2" fontWeight={800}>{money(total)}</Typography>
            </Box>
          </Box>

          <Stack spacing={1} sx={{ width: '100%' }}>
            {items.slice(0, 6).map((item, index) => {
              const percentage = (item.value / total) * 100;
              return (
                <Stack key={item.label} direction="row" alignItems="center" justifyContent="space-between" spacing={1.2}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length], flexShrink: 0 }} />
                    <Typography variant="body2" noWrap>{item.label}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{percentage.toFixed(1)}%</Typography>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">Sin datos para mostrar.</Typography>
      )}
    </Paper>
  );
};

const ListPanel = ({
  title,
  subtitle,
  icon,
  children
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) => (
  <Paper sx={{ p: 2.5, height: '100%', border: '1px solid', borderColor: 'divider' }}>
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
      <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', backgroundColor: 'action.hover' }}>{icon}</Box>
      <Box>
        <Typography variant="h6" fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      </Box>
    </Stack>
    {children}
  </Paper>
);

export default function HomePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await reportService.getDashboard();
      setStats(data);
    } catch {
      setError('No se pudo cargar el dashboard.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportReport = async (reportKey: string, format: 'csv' | 'xlsx' | 'pdf') => {
    const blob = await reportService.exportReport(reportKey, format);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportKey}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const latestSales = useMemo(() => {
    return (stats?.latestSales ?? []).slice(0, 4);
  }, [stats]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(180deg, #09090b 0%, #0f172a 100%)'
          : 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)'
      }}
    >
      <Container sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Paper
            sx={{
              p: { xs: 2.5, md: 4 },
              background: isDark
                ? 'linear-gradient(135deg, #111827 0%, #1e293b 45%, #155e75 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0f766e 100%)',
              color: '#fff',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 'auto -100px -120px auto',
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                filter: 'blur(12px)'
              }}
            />
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              sx={{ position: 'relative', zIndex: 1 }}
            >
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: 'rgba(255,255,255,0.78)' }}>
                  ERP COMERCIAL
                </Typography>
                <Typography variant="h3" fontWeight={900} sx={{ mt: 0.5 }}>
                  Dashboard operativo
                </Typography>
                <Typography sx={{ mt: 1.2, maxWidth: 760, color: 'rgba(255,255,255,0.82)' }}>
                  Seguimiento comercial, caja, stock y rentabilidad en una consola profesional diseñada para operación diaria.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="contained" onClick={load} startIcon={<RefreshIcon />} sx={{ backgroundColor: '#fff', color: '#0f172a', '&:hover': { backgroundColor: '#e2e8f0' } }}>
                  Actualizar
                </Button>
                <Button variant="outlined" onClick={() => exportReport('profitability', 'pdf')} sx={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
                  Exportar rentabilidad
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Grid container spacing={2.2}>
            <Grid item xs={12} sm={6} lg={3}>
                <MetricCard title="Ventas del día" value={money(stats?.today.sales ?? 0)} helper="Ingresos facturados hoy" icon={<ReceiptLongIcon />} trend="positive" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <MetricCard title="Ventas del mes" value={money(stats?.month.sales ?? 0)} helper="Acumulado mensual" icon={<StorefrontIcon />} trend="positive" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <MetricCard title="Ganancias" value={money(stats?.totals.profit ?? 0)} helper={`Rentabilidad ${Number(stats?.totals.profitability ?? 0).toFixed(2)}%`} icon={<AttachMoneyIcon />} trend={Number(stats?.totals.profit ?? 0) >= 0 ? 'positive' : 'negative'} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <MetricCard title="Clientes con deuda" value={String(stats?.debtCustomers.length ?? 0)} helper="Cuentas corrientes activas" icon={<CreditScoreIcon />} trend="negative" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <MetricCard title="Productos sin stock" value={String(stats?.productsWithoutStock.length ?? 0)} helper="Requieren reposición urgente" icon={<Inventory2Icon />} trend="negative" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <MetricCard title="Stock crítico" value={String(stats?.criticalStock.length ?? 0)} helper="Bajo el mínimo configurado" icon={<AssessmentIcon />} trend="negative" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <MetricCard title="Compras pendientes" value={String(stats?.pendingPurchases.length ?? 0)} helper="Órdenes en proceso" icon={<LocalShippingIcon />} trend="negative" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
                <MetricCard title="Caja" value={money(stats?.totals.cashBalance ?? 0)} helper="Saldo consolidado" icon={<ShowChartIcon />} trend={Number(stats?.totals.cashBalance ?? 0) >= 0 ? 'positive' : 'negative'} />
            </Grid>
          </Grid>

          <Grid container spacing={2.2}>
            <Grid item xs={12} md={4}>
              <LineChartPanel
                title="Ingresos del local"
                subtitle="Facturacion diaria"
                icon={<ReceiptLongIcon />}
                items={stats?.salesByDay ?? []}
                color="#2563eb"
                metricLabel="Ingresos"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <LineChartPanel
                title="Margen del negocio"
                subtitle="Margen diario estimado"
                icon={<AttachMoneyIcon />}
                items={(stats?.salesByDay ?? []).map((item) => ({ label: item.label, value: item.value * 0.18 }))}
                color="#16a34a"
                metricLabel="Margen"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DonutChartPanel
                title="Gráfico por categorías"
                subtitle="Ventas por categoría"
                icon={<AssessmentIcon />}
                items={stats?.salesByCategory ?? []}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.2}>
            <Grid item xs={12} lg={4}>
              <ListPanel title="Productos más vendidos" subtitle="Unidades vendidas" icon={<Inventory2Icon />}>
                <Stack spacing={1.2}>
                  {(stats?.topProducts ?? []).slice(0, 4).map((product) => (
                    <Box key={product.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{product.quantity} uds</Typography>
                      </Box>
                      <Chip label={money(product.total)} size="small" color="primary" variant="outlined" />
                    </Box>
                  ))}
                </Stack>
              </ListPanel>
            </Grid>
            <Grid item xs={12} lg={4}>
              <ListPanel title="Clientes con deuda" subtitle="Saldo actual" icon={<CreditScoreIcon />}>
                <Stack spacing={1.2}>
                  {[...(stats?.debtCustomers ?? [])]
                    .sort((a, b) => Number(b.balance) - Number(a.balance))
                    .slice(0, 4)
                    .map((customer) => (
                    <Box key={customer.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{customer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Límite {money(customer.creditLimit)}</Typography>
                      </Box>
                      <Chip label={money(customer.balance)} size="small" color="error" variant="outlined" />
                    </Box>
                  ))}
                </Stack>
              </ListPanel>
            </Grid>
            <Grid item xs={12} lg={4}>
              <ListPanel title="Últimas ventas" subtitle="Movimientos recientes" icon={<ReceiptLongIcon />}>
                <TableContainer sx={{ maxHeight: 340 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {latestSales.map((sale) => (
                        <TableRow key={sale.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{new Date(sale.createdAt).toLocaleDateString()}</Typography>
                            <Typography variant="caption" color="text.secondary">{sale.customer?.businessName || `${sale.customer?.firstName ?? ''} ${sale.customer?.lastName ?? ''}`.trim() || 'Consumidor final'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={sale.saleType} />
                          </TableCell>
                          <TableCell align="right">{money(Number(sale.total))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </ListPanel>
            </Grid>
          </Grid>

          <Grid container spacing={2.2}>
            <Grid item xs={12} md={6}>
              <ListPanel title="Productos sin stock" subtitle="Prioridad de reposición" icon={<CancelIcon />}>
                <Stack spacing={1.2}>
                  {(stats?.productsWithoutStock ?? []).slice(0, 4).map((product) => (
                    <Box key={product.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{product.internalCode}</Typography>
                      </Box>
                      <Chip label="Sin stock" size="small" color="error" />
                    </Box>
                  ))}
                </Stack>
              </ListPanel>
            </Grid>
            <Grid item xs={12} md={6}>
              <ListPanel title="Stock crítico y compras pendientes" subtitle="Control operativo" icon={<LocalShippingIcon />}>
                <Stack spacing={1.4}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Stock crítico</Typography>
                    <Stack spacing={1}>
                      {(stats?.criticalStock ?? []).slice(0, 4).map((product) => (
                        <Box key={product.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                            {product.mainImage ? (
                              <Box
                                component="img"
                                src={resolveDashboardImageUrl(product.mainImage)}
                                alt={product.name}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 1,
                                  objectFit: 'cover',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  flexShrink: 0
                                }}
                              />
                            ) : null}
                            <Typography variant="body2" noWrap>{product.name}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">{product.stock}/{product.minStock}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Compras pendientes</Typography>
                    <Stack spacing={1}>
                      {(stats?.pendingPurchases ?? []).slice(0, 4).map((purchase) => (
                        <Box key={purchase.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                          <Typography variant="body2">{new Date(purchase.createdAt).toLocaleDateString()}</Typography>
                          <Chip label={money(purchase.total)} size="small" variant="outlined" />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </ListPanel>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
