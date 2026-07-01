import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { stockService } from '../services/stockService';
import { productService, type Product } from '../services/productService';

export default function StockPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<{ totalAlerts: number; lowStockCount: number; expiringSoonCount: number; items: any[] }>({
    totalAlerts: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
    items: []
  });
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [operationType, setOperationType] = useState<'INCOMING' | 'OUTGOING' | 'TRANSFER' | null>(null);
  const [operationSaving, setOperationSaving] = useState(false);
  const [movementsPage, setMovementsPage] = useState(0);
  const [movementDetail, setMovementDetail] = useState<any | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [operationForm, setOperationForm] = useState({
    productId: '',
    quantity: '1',
    location: 'GENERAL',
    fromLocation: 'GENERAL',
    toLocation: 'GENERAL',
    note: '',
    reference: ''
  });

  const loadStockData = async () => {
    const [stockResult, alertsResult] = await Promise.all([
      stockService.getStock({ search, limit: 20 }),
      stockService.getAlerts()
    ]);

    setStocks(stockResult.stocks ?? stockResult.data ?? []);
    setAlerts(
      alertsResult?.items
        ? alertsResult
        : {
            totalAlerts: Array.isArray(alertsResult) ? alertsResult.length : 0,
            lowStockCount: Array.isArray(alertsResult) ? alertsResult.length : 0,
            expiringSoonCount: 0,
            items: Array.isArray(alertsResult) ? alertsResult : []
          }
    );
  };

  useEffect(() => {
    loadStockData().catch(() => setMessage('No se pudo cargar la pantalla de stock.'));
  }, [search]);

  useEffect(() => {
    if (!operationType) return;

    const query = productSearch.trim();
    if (query.length < 2) {
      const fromStock = stocks
        .map((item) => item.product)
        .filter((product, index, arr) => Boolean(product) && arr.findIndex((entry) => entry?.id === product.id) === index)
        .slice(0, 20);
      setProductOptions(fromStock);
      return;
    }

    const timer = window.setTimeout(() => {
      productService
        .searchProducts(query, 20)
        .then((products) => setProductOptions(products))
        .catch(() => setMessage('No se pudieron buscar productos para la operación de stock.'));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [operationType, productSearch, stocks]);

  const openOperationDialog = (type: 'INCOMING' | 'OUTGOING' | 'TRANSFER') => {
    setOperationType(type);
    setProductSearch('');
    setProductOptions(
      stocks
        .map((item) => item.product)
        .filter((product, index, arr) => Boolean(product) && arr.findIndex((entry) => entry?.id === product.id) === index)
        .slice(0, 20)
    );
    setOperationForm({
      productId: '',
      quantity: '1',
      location: 'GENERAL',
      fromLocation: 'GENERAL',
      toLocation: 'GENERAL',
      note: '',
      reference: ''
    });
  };

  const closeOperationDialog = () => {
    setOperationType(null);
  };

  const handleSubmitOperation = async () => {
    const quantity = Number(operationForm.quantity);

    if (!operationType) return;
    if (!operationForm.productId) {
      setMessage('Seleccioná un producto para registrar la operación.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage('La cantidad debe ser un número mayor a 0.');
      return;
    }

    setOperationSaving(true);
    setMessage(null);
    try {
      if (operationType === 'TRANSFER') {
        await stockService.transfer({
          productId: operationForm.productId,
          fromLocation: operationForm.fromLocation || 'GENERAL',
          toLocation: operationForm.toLocation || 'GENERAL',
          quantity,
          reference: operationForm.reference || undefined,
          note: operationForm.note || undefined
        });
      } else {
        await stockService.movement({
          productId: operationForm.productId,
          movementType: operationType,
          quantity,
          location: operationType === 'INCOMING' ? operationForm.location || 'GENERAL' : operationForm.fromLocation || 'GENERAL',
          reference: operationForm.reference || undefined,
          note: operationForm.note || undefined
        });
      }

      setMessage('Operación de stock registrada correctamente.');
      closeOperationDialog();
      await loadStockData();
    } catch {
      setMessage('No se pudo registrar la operación de stock. Verificá permisos y datos.');
    } finally {
      setOperationSaving(false);
    }
  };

  const operationTitle =
    operationType === 'INCOMING' ? 'Registrar entrada de stock' : operationType === 'OUTGOING' ? 'Registrar salida de stock' : 'Registrar transferencia de stock';

  const movementTypeLabel = (type: string) => {
    if (type === 'INCOMING') return 'Entrada de Lote / Compra';
    if (type === 'OUTGOING') return 'Venta / Despacho';
    if (type === 'TRANSFER') return 'Traspaso / Ajuste Interno';
    if (type === 'ADJUSTMENT') return 'Ajuste';
    return type;
  };

  const recentMovements = useMemo(() => {
    const movements = stocks.flatMap((item) =>
      (item.movements ?? []).map((movement: any) => ({
        ...movement,
        productName: item.product?.name ?? movement.productId,
        location: item.location
      }))
    );

    const uniqueById = Array.from(new Map(movements.map((movement: any) => [movement.id, movement])).values());

    return uniqueById.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stocks]);

  const movementsPerPage = 10;
  const paginatedMovements = recentMovements.slice(
    movementsPage * movementsPerPage,
    movementsPage * movementsPerPage + movementsPerPage
  );

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Stock</Typography>
          <Typography color="text.secondary">Entradas, salidas, transferencias, inventario, ajustes, mínimos y alertas.</Typography>
        </Box>

        {message ? <Alert severity="warning">{message}</Alert> : null}

        <Paper sx={{ p: 2 }}>
          <TextField fullWidth label="Buscar stock" value={search} onChange={(e) => setSearch(e.target.value)} />
        </Paper>

        {alerts.totalAlerts > 0 ? (
          <Alert severity="warning">
            Alertas activas: {alerts.lowStockCount} con stock minimo y {alerts.expiringSoonCount} con vencimiento proximo (menos de 30 dias).
          </Alert>
        ) : null}

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Operaciones</Typography>
          <Button variant="contained" sx={{ mr: 1 }} onClick={() => openOperationDialog('INCOMING')}>Registrar entrada</Button>
          <Button variant="outlined" sx={{ mr: 1 }} onClick={() => openOperationDialog('OUTGOING')}>Registrar salida</Button>
          <Button variant="outlined" /*onClick={() => openOperationDialog('TRANSFER')} */>Transferencia</Button>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Movimientos recientes</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell>Referencia</TableCell>
                  <TableCell align="right"> </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>No hay movimientos recientes.</TableCell>
                  </TableRow>
                ) : (
                  paginatedMovements.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell>{new Date(movement.createdAt).toLocaleString('es-AR')}</TableCell>
                      <TableCell>{movement.productName}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={movementTypeLabel(movement.movementType)}
                          color={
                            movement.movementType === 'INCOMING'
                              ? 'success'
                              : movement.movementType === 'OUTGOING'
                                ? 'error'
                                : movement.movementType === 'TRANSFER'
                                  ? 'info'
                                  : 'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{movement.quantity}</TableCell>
                      <TableCell>{movement.location || '-'}</TableCell>
                      <TableCell>{movement.reference || '-'}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" onClick={() => setMovementDetail(movement)}>
                          Abrir detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={recentMovements.length}
            page={movementsPage}
            onPageChange={(_, page) => setMovementsPage(page)}
            rowsPerPage={movementsPerPage}
            rowsPerPageOptions={[10]}
            labelRowsPerPage="Movimientos por página"
          />
        </Paper>
      </Stack>

      <Dialog open={Boolean(operationType)} onClose={closeOperationDialog} fullWidth maxWidth="sm">
        <DialogTitle>{operationTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Buscar producto"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              helperText="Escribí 2 caracteres para buscar o elegí de la lista"
              fullWidth
            />

            <TextField
              select
              label="Producto"
              value={operationForm.productId}
              onChange={(event) => setOperationForm((prev) => ({ ...prev, productId: event.target.value }))}
              fullWidth
            >
              {productOptions.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.internalCode} - {product.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Cantidad"
              type="number"
              value={operationForm.quantity}
              onChange={(event) => setOperationForm((prev) => ({ ...prev, quantity: event.target.value }))}
              fullWidth
            />

            {operationType === 'INCOMING' ? (
              <TextField
                label="Ubicación"
                value={operationForm.location}
                onChange={(event) => setOperationForm((prev) => ({ ...prev, location: event.target.value }))}
                fullWidth
              />
            ) : null}

            {operationType === 'OUTGOING' || operationType === 'TRANSFER' ? (
              <TextField
                label="Ubicación origen"
                value={operationForm.fromLocation}
                onChange={(event) => setOperationForm((prev) => ({ ...prev, fromLocation: event.target.value }))}
                fullWidth
              />
            ) : null}

            {operationType === 'TRANSFER' ? (
              <TextField
                label="Ubicación destino"
                value={operationForm.toLocation}
                onChange={(event) => setOperationForm((prev) => ({ ...prev, toLocation: event.target.value }))}
                fullWidth
              />
            ) : null}

            <TextField
              label="Referencia"
              value={operationForm.reference}
              onChange={(event) => setOperationForm((prev) => ({ ...prev, reference: event.target.value }))}
              fullWidth
            />

            <TextField
              label="Nota"
              value={operationForm.note}
              onChange={(event) => setOperationForm((prev) => ({ ...prev, note: event.target.value }))}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeOperationDialog} disabled={operationSaving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitOperation} disabled={operationSaving}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(movementDetail)} onClose={() => setMovementDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle>Detalle del movimiento</DialogTitle>
        <DialogContent>
          {movementDetail ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography><strong>Fecha:</strong> {new Date(movementDetail.createdAt).toLocaleString('es-AR')}</Typography>
              <Typography><strong>Producto:</strong> {movementDetail.productName}</Typography>
              <Typography><strong>Tipo:</strong> {movementTypeLabel(movementDetail.movementType)}</Typography>
              <Typography><strong>Cantidad:</strong> {movementDetail.quantity}</Typography>
              <Typography><strong>Ubicación:</strong> {movementDetail.location || 'GENERAL'}</Typography>
              <Typography><strong>Referencia:</strong> {movementDetail.reference || '-'}</Typography>
              <Typography><strong>Nota:</strong> {movementDetail.note || '-'}</Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}