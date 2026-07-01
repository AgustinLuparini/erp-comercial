import { useEffect, useState } from 'react';
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
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { purchaseService } from '../services/purchaseService';
import { partnerService, type Supplier } from '../services/partnerService';
import { productService, type Product } from '../services/productService';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProductOptions, setLoadingProductOptions] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [confirmCompleteDialogOpen, setConfirmCompleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiveSaving, setReceiveSaving] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveDetails, setReceiveDetails] = useState<Array<{ productId: string; quantityReceived: string; location: string }>>([]);
  const [createForm, setCreateForm] = useState({
    supplierId: '',
    productId: '',
    quantity: '1',
    unitPrice: '0',
    notes: ''
  });

  const loadPurchases = async () => {
    try {
      const data = await purchaseService.getPurchases({ search, limit: 20 });
      setPurchases(data.purchases ?? data.data ?? []);
    } catch {
      setMessage('No se pudieron cargar las compras. Verifica el backend.');
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [search]);

  useEffect(() => {
    Promise.all([
      partnerService.getSuppliers({ limit: 200 })
    ])
      .then(([supplierResult]) => {
        setSuppliers(supplierResult.suppliers ?? []);
      })
      .catch(() => {
        setMessage('No se pudieron cargar proveedores/productos para crear compras.');
      });
  }, []);

  useEffect(() => {
    if (!createDialogOpen) return;

    const query = productSearch.trim();
    if (query.length < 2) {
      setProductOptions([]);
      return;
    }

    setLoadingProductOptions(true);
    const timer = window.setTimeout(() => {
      productService
        .searchProducts(query, 20)
        .then((productsFound) => {
          setProductOptions(productsFound);
        })
        .catch(() => {
          setMessage('No se pudieron buscar productos para la orden de compra.');
        })
        .finally(() => {
          setLoadingProductOptions(false);
        });
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [createDialogOpen, productSearch]);

  const openCreateDialog = () => {
    setCreateForm({
      supplierId: suppliers[0]?.id ?? '',
      productId: '',
      quantity: '1',
      unitPrice: '0',
      notes: ''
    });
    setSelectedProduct(null);
    setProductSearch('');
    setProductOptions([]);
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => setCreateDialogOpen(false);

  const pendingPurchases = purchases.filter((purchase) => purchase.status === 'PENDING');
  const completedPurchases = purchases.filter((purchase) => purchase.status === 'RECEIVED');
  const otherPurchases = purchases.filter((purchase) => purchase.status !== 'PENDING' && purchase.status !== 'RECEIVED');

  const renderPurchaseCard = (purchase: any, tone: 'warning' | 'success' | 'default') => {
    const toneStyles =
      tone === 'warning'
        ? { borderLeft: '4px solid', borderColor: 'warning.main', bgcolor: 'warning.50' }
        : tone === 'success'
          ? { borderLeft: '4px solid', borderColor: 'success.main', bgcolor: 'success.50' }
          : { borderLeft: '4px solid', borderColor: 'divider', bgcolor: 'background.paper' };

    return (
      <Grid item xs={12} md={6} key={purchase.id}>
        <Paper sx={{ p: 2, ...toneStyles }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
            <Typography variant="h6">{purchase.purchaseNumber || purchase.id}</Typography>
            <Chip
              size="small"
              label={purchase.status === 'PENDING' ? 'Pendiente' : purchase.status === 'RECEIVED' ? 'Completada' : purchase.status}
              color={purchase.status === 'PENDING' ? 'warning' : purchase.status === 'RECEIVED' ? 'success' : 'default'}
              variant={purchase.status === 'PENDING' ? 'filled' : 'outlined'}
            />
          </Stack>
          <Typography variant="body2">Proveedor: {purchase.supplier?.businessName ?? purchase.supplierId}</Typography>
          <Typography variant="body2">Estado: {purchase.status}</Typography>
          <Typography variant="body2">Total: {Number(purchase.total ?? 0).toFixed(2)}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={async () => {
                try {
                  const pdfBlob = await purchaseService.getPurchasePdf(purchase.id);
                  const url = window.URL.createObjectURL(pdfBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `compra-${purchase.purchaseNumber || purchase.id}.pdf`;
                  link.click();
                  window.URL.revokeObjectURL(url);
                } catch {
                  setMessage('No se pudo descargar el PDF de la compra.');
                }
              }}
            >
              Descargar PDF
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={async () => {
                try {
                  const pdfBlob = await purchaseService.getPurchasePdf(purchase.id);
                  const url = window.URL.createObjectURL(pdfBlob);
                  const printWindow = window.open(url, '_blank');
                  if (printWindow) {
                    printWindow.onload = () => {
                      printWindow.print();
                    };
                  }
                  window.setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                } catch {
                  setMessage('No se pudo imprimir el PDF de la compra.');
                }
              }}
            >
              Imprimir
            </Button>
          </Stack>
        </Paper>
      </Grid>
    );
  };

  const buildReceiveDetails = (purchaseId: string) => {
    const purchase = pendingPurchases.find((item) => item.id === purchaseId);
    if (!purchase) {
      setReceiveDetails([]);
      return;
    }

    const details = (purchase.details ?? []).map((detail: any) => ({
      productId: detail.productId,
      quantityReceived: String(detail.quantity ?? 0),
      location: 'GENERAL'
    }));
    setReceiveDetails(details);
  };

  const openReceiveDialog = () => {
    if (pendingPurchases.length === 0) {
      setMessage('No hay compras pendientes para recibir.');
      return;
    }

    const firstPendingId = pendingPurchases[0].id;
    setSelectedPurchaseId(firstPendingId);
    setReceiveNotes('');
    buildReceiveDetails(firstPendingId);
    setReceiveDialogOpen(true);
  };

  const closeReceiveDialog = () => setReceiveDialogOpen(false);
  const openConfirmCompleteDialog = () => setConfirmCompleteDialogOpen(true);
  const closeConfirmCompleteDialog = () => setConfirmCompleteDialogOpen(false);

  const handleReceivePurchase = async () => {
    if (!selectedPurchaseId) return;

    const payloadDetails = receiveDetails
      .map((detail) => ({
        productId: detail.productId,
        quantityReceived: Number(detail.quantityReceived),
        location: detail.location || 'GENERAL'
      }))
      .filter((detail) => Number.isFinite(detail.quantityReceived) && detail.quantityReceived > 0);

    if (payloadDetails.length === 0) {
      setMessage('Ingresá al menos una cantidad recibida mayor a 0.');
      return;
    }

    setReceiveSaving(true);
    setMessage(null);
    try {
      await purchaseService.receivePurchase({
        purchaseId: selectedPurchaseId,
        notes: receiveNotes || undefined,
        details: payloadDetails
      });
      setMessage('Recepción registrada correctamente.');
      closeReceiveDialog();
      await loadPurchases();
    } catch {
      setMessage('No se pudo registrar la recepción. Verificá permisos y cantidades.');
    } finally {
      setReceiveSaving(false);
    }
  };

  const handleCompleteReceive = async () => {
    if (!selectedPurchaseId) return;
    setReceiveSaving(true);
    setMessage(null);
    try {
      await purchaseService.completeReceive(selectedPurchaseId);
      setMessage('Recepción completa registrada correctamente.');
      closeConfirmCompleteDialog();
      closeReceiveDialog();
      await loadPurchases();
    } catch {
      setMessage('No se pudo completar la recepción. Verificá permisos.');
    } finally {
      setReceiveSaving(false);
    }
  };

  const handleProductChange = (productId: string) => {
    const selected = productOptions.find((product) => product.id === productId) ?? null;
    setSelectedProduct(selected);
    setCreateForm((prev) => ({
      ...prev,
      productId,
      unitPrice: selected ? String(selected.cost ?? 0) : prev.unitPrice
    }));
  };

  const handleCreatePurchase = async () => {
    const quantity = Number(createForm.quantity);
    const unitPrice = Number(createForm.unitPrice);

    if (!createForm.supplierId || !createForm.productId) {
      setMessage('Seleccioná proveedor y producto para crear la compra.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      setMessage('Cantidad y precio deben ser valores válidos.');
      return;
    }

    const subtotal = quantity * unitPrice;

    setSaving(true);
    setMessage(null);
    try {
      await purchaseService.createPurchase({
        supplierId: createForm.supplierId,
        subtotal,
        total: subtotal,
        discount: 0,
        tax: 0,
        notes: createForm.notes || undefined,
        details: [
          {
            productId: createForm.productId,
            quantity,
            unit: selectedProduct?.unit ?? 'UN',
            unitPrice,
            discount: 0,
            tax: 0
          }
        ]
      });
      setMessage('Orden de compra creada correctamente.');
      closeCreateDialog();
      await loadPurchases();
    } catch {
      setMessage('No se pudo crear la orden de compra. Verificá permisos y datos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Compras</Typography>
          <Typography color="text.secondary">Orden de compra, recepción parcial/completa y actualización automática de stock.</Typography>
        </Box>
        {message ? <Alert severity="warning">{message}</Alert> : null}
        <Paper sx={{ p: 2 }}>
          <TextField fullWidth label="Buscar compras" value={search} onChange={(e) => setSearch(e.target.value)} />
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Pendientes de recepción</Typography>
            <Chip label={String(pendingPurchases.length)} color="warning" size="small" />
          </Stack>
          <Grid container spacing={2}>
            {pendingPurchases.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">No hay compras pendientes de recepción.</Alert>
              </Grid>
            ) : (
              pendingPurchases.map((purchase) => renderPurchaseCard(purchase, 'warning'))
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Recepciones completadas</Typography>
            <Chip label={String(completedPurchases.length)} color="success" size="small" />
          </Stack>
          <Grid container spacing={2}>
            {completedPurchases.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">No hay compras completadas.</Alert>
              </Grid>
            ) : (
              completedPurchases.map((purchase) => renderPurchaseCard(purchase, 'success'))
            )}
          </Grid>
        </Paper>

        {otherPurchases.length > 0 ? (
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Otros estados</Typography>
              <Chip label={String(otherPurchases.length)} size="small" />
            </Stack>
            <Grid container spacing={2}>
              {otherPurchases.map((purchase) => renderPurchaseCard(purchase, 'default'))}
            </Grid>
          </Paper>
        ) : null}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Acciones rápidas</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="contained" onClick={openCreateDialog}>Nueva Orden</Button>
            <Button variant="outlined" onClick={openReceiveDialog}>Recepción</Button>
          </Stack>
        </Paper>
      </Stack>

      <Dialog open={createDialogOpen} onClose={closeCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle>Nueva orden de compra</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Proveedor"
              value={createForm.supplierId}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, supplierId: event.target.value }))}
              fullWidth
            >
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.businessName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Buscar producto"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              fullWidth
              helperText="Escribí al menos 2 caracteres"
            />

            <TextField
              select
              label="Producto"
              value={createForm.productId}
              onChange={(event) => handleProductChange(event.target.value)}
              fullWidth
              disabled={loadingProductOptions}
            >
              {productOptions.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.internalCode} - {product.name}
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cantidad"
                  type="number"
                  fullWidth
                  value={createForm.quantity}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, quantity: event.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Precio unitario"
                  type="number"
                  fullWidth
                  value={createForm.unitPrice}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
                />
              </Grid>
            </Grid>

            <TextField
              label="Notas"
              value={createForm.notes}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, notes: event.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateDialog} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreatePurchase} disabled={saving}>
            Crear orden
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={receiveDialogOpen} onClose={closeReceiveDialog} fullWidth maxWidth="md">
        <DialogTitle>Recepción de compra</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Compra pendiente"
              value={selectedPurchaseId}
              onChange={(event) => {
                const nextId = event.target.value;
                setSelectedPurchaseId(nextId);
                buildReceiveDetails(nextId);
              }}
              fullWidth
            >
              {pendingPurchases.map((purchase) => (
                <MenuItem key={purchase.id} value={purchase.id}>
                  {(purchase.purchaseNumber || purchase.id)} - {purchase.supplier?.businessName ?? purchase.supplierId}
                </MenuItem>
              ))}
            </TextField>

            {receiveDetails.map((detail, index) => {
              const purchase = pendingPurchases.find((item) => item.id === selectedPurchaseId);
              const original = (purchase?.details ?? []).find((item: any) => item.productId === detail.productId);
              const productName = original?.product?.name ?? detail.productId;
              const orderedQuantity = Number(original?.quantity ?? 0);

              return (
                <Grid container spacing={2} key={`${detail.productId}-${index}`}>
                  <Grid item xs={12} md={5}>
                    <TextField fullWidth label="Producto" value={productName} disabled />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth label="Pedida" value={String(orderedQuantity)} disabled />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Recibida"
                      type="number"
                      value={detail.quantityReceived}
                      onChange={(event) => {
                        const value = event.target.value;
                        setReceiveDetails((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, quantityReceived: value } : item)));
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Ubicación"
                      value={detail.location}
                      onChange={(event) => {
                        const value = event.target.value;
                        setReceiveDetails((prev) => prev.map((item, currentIndex) => (currentIndex === index ? { ...item, location: value } : item)));
                      }}
                    />
                  </Grid>
                </Grid>
              );
            })}

            <TextField
              label="Notas de recepción"
              value={receiveNotes}
              onChange={(event) => setReceiveNotes(event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReceiveDialog} disabled={receiveSaving}>Cancelar</Button>
          <Button variant="contained" onClick={openConfirmCompleteDialog} disabled={receiveSaving || !selectedPurchaseId}>
            Recepción completa
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmCompleteDialogOpen} onClose={closeConfirmCompleteDialog}>
        <DialogTitle>Confirmar recepción completa</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Seguro que querés marcar esta compra como recibida completamente?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmCompleteDialog} disabled={receiveSaving}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleCompleteReceive} disabled={receiveSaving}>
            Confirmar recepción
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}