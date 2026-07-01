import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { cashService, type CashBox } from '../services/cashService';

export default function CashPage() {
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loadingCashBoxes, setLoadingCashBoxes] = useState(true);
  const [name, setName] = useState('Caja General');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [amount, setAmount] = useState('0');
  const [description, setDescription] = useState('');
  const [movementType, setMovementType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [countedAmount, setCountedAmount] = useState('0');
  const [message, setMessage] = useState<string | null>(null);

  const selectedCashBox = useMemo(() => cashBoxes.find((cashBox) => cashBox.id === selectedId), [cashBoxes, selectedId]);
  const openedCashBox = useMemo(() => cashBoxes.find((cashBox) => cashBox.status === 'OPEN'), [cashBoxes]);
  const computedClosingBalance = useMemo(() => {
    const opening = Number(selectedCashBox?.openingBalance ?? 0);
    const movements = selectedCashBox?.movements ?? [];
    const income = movements
      .filter((movement) => movement.movementType === 'INCOME')
      .reduce((sum, movement) => sum + Number(movement.amount), 0);
    const expense = movements
      .filter((movement) => movement.movementType === 'EXPENSE')
      .reduce((sum, movement) => sum + Number(movement.amount), 0);

    return opening + income - expense;
  }, [selectedCashBox]);

  const closingDifference = useMemo(() => {
    const counted = Number(countedAmount);
    if (!Number.isFinite(counted)) return 0;
    return counted - computedClosingBalance;
  }, [countedAmount, computedClosingBalance]);

  const getMovementPresentation = (movement: { movementType: 'INCOME' | 'EXPENSE'; description?: string }) => {
    const isCashClose = movement.description?.includes('Cierre de caja');

    if (isCashClose) {
      if (movement.movementType === 'EXPENSE') {
        return { label: 'Negativo', color: 'error.main' };
      }
      return { label: 'Positivo', color: 'success.main' };
    }

    if (movement.movementType === 'INCOME') {
      return { label: 'Ingreso', color: 'success.main' };
    }

    return { label: 'Egreso', color: 'error.main' };
  };

  const load = async () => {
    setLoadingCashBoxes(true);
    try {
      const [openData, listData] = await Promise.all([
        cashService.list({ status: 'OPEN', limit: 1 }),
        cashService.list({ limit: 20 })
      ]);

      const openBox = openData.cashBoxes[0];
      const mergedCashBoxes = openBox
        ? [
            openBox,
            ...listData.cashBoxes.filter((cashBox) => cashBox.id !== openBox.id)
          ]
        : listData.cashBoxes;

      setCashBoxes(mergedCashBoxes);
      setSelectedId(openBox?.id ?? mergedCashBoxes[0]?.id ?? '');
    } finally {
      setLoadingCashBoxes(false);
    }
  };

  useEffect(() => {
    load().catch(() => setMessage('No se pudo cargar la caja'));
  }, []);

  const openCashBox = async () => {
    setMessage(null);
    if (loadingCashBoxes) return;
    if (openedCashBox) {
      setMessage('Ya hay una caja abierta. Debe cerrarla para abrir una nueva.');
      return;
    }

    const cashBox = await cashService.open({ name, openingBalance: Number(openingBalance) });
    setMessage('Caja abierta correctamente');
    setSelectedId(cashBox.id);
    await load();
  };

  const openCloseDialog = () => {
    if (!selectedId || selectedCashBox?.status !== 'OPEN') return;
    setCountedAmount(computedClosingBalance.toFixed(2));
    setCloseDialogOpen(true);
  };

  const closeCloseDialog = () => {
    setCloseDialogOpen(false);
  };

  const closeCashBox = async () => {
    if (!selectedId) return;
    setMessage(null);
    const counted = Number(countedAmount);
    if (!Number.isFinite(counted) || counted < 0) {
      setMessage('Ingresá un monto contado válido para cerrar la caja.');
      return;
    }

    await cashService.close(selectedId, { closingBalance: counted });
    setMessage(`Caja cerrada correctamente. Diferencia de arqueo: ${closingDifference.toFixed(2)}`);
    closeCloseDialog();
    await load();
  };

  const registerMovement = async () => {
    if (!selectedId) return;
    setMessage(null);
    if (movementType === 'INCOME') {
      await cashService.income(selectedId, { amount: Number(amount), description });
    } else {
      await cashService.expense(selectedId, { amount: Number(amount), description });
    }
    setMessage('Movimiento registrado');
    await load();
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Caja</Typography>
          <Typography color="text.secondary">Apertura, cierre, arqueo, ingresos, egresos e historial de movimientos.</Typography>
        </Box>

        {message ? <Alert severity="info">{message}</Alert> : null}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
                <TextField label="Apertura" type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
                <Button variant="contained" onClick={openCashBox} disabled={loadingCashBoxes || Boolean(openedCashBox)}>
                  {openedCashBox ? 'Ya hay una caja abierta' : 'Abrir caja'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <TextField select label="Caja activa" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  {cashBoxes
                    .filter((cashBox) => cashBox.status === 'OPEN')
                    .map((cashBox) => (
                    <MenuItem value={cashBox.id} key={cashBox.id}>{cashBox.name} - {cashBox.status}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Cierre calculado" type="number" value={computedClosingBalance.toFixed(2)} InputProps={{ readOnly: true }} helperText="Se calcula automáticamente según apertura y movimientos" />
                <Button variant="outlined" onClick={openCloseDialog} disabled={!selectedId || selectedCashBox?.status !== 'OPEN'}>Cerrar caja</Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <TextField select label="Movimiento" value={movementType} onChange={(e) => setMovementType(e.target.value as 'INCOME' | 'EXPENSE')}>
                  <MenuItem value="INCOME">Ingreso</MenuItem>
                  <MenuItem value="EXPENSE">Egreso</MenuItem>
                </TextField>
                <TextField label="Monto" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
                <Button variant="contained" onClick={registerMovement} disabled={!selectedId || selectedCashBox?.status !== 'OPEN'}>Registrar movimiento</Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Resumen</Typography>
                <Typography>Caja seleccionada: {selectedCashBox?.name ?? '-'}</Typography>
                <Typography>Estado: {selectedCashBox?.status ?? '-'}</Typography>
                <Typography>Apertura: ${Number(selectedCashBox?.openingBalance ?? 0).toFixed(2)}</Typography>
                <Typography>Cierre: ${Number(selectedCashBox?.closingBalance ?? 0).toFixed(2)}</Typography>
                <Typography>Movimientos: {selectedCashBox?.movements?.length ?? 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Historial</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedCashBox?.movements ?? []).map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{new Date(movement.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Typography sx={{ color: getMovementPresentation(movement).color, fontWeight: 700 }}>
                        {getMovementPresentation(movement).label}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: getMovementPresentation(movement).color, fontWeight: 700 }}>
                        {movement.movementType === 'EXPENSE' ? '-' : '+'}${movement.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>{movement.description ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Stack>

      <Dialog open={closeDialogOpen} onClose={closeCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>Arqueo y cierre de caja</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Monto esperado"
              value={computedClosingBalance.toFixed(2)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Monto contado"
              type="number"
              value={countedAmount}
              onChange={(e) => setCountedAmount(e.target.value)}
              fullWidth
            />
            <TextField
              label="Diferencia"
              value={closingDifference.toFixed(2)}
              InputProps={{ readOnly: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={closeCashBox}>Confirmar cierre</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
