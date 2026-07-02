import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  IconButton,
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
  TableRow,
  InputAdornment
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon, Print as PrintIcon } from '@mui/icons-material';
import { productService, type Product } from '../services/productService';
import { salesService, type SaleItem } from '../services/salesService';
import { partnerService, type Customer } from '../services/partnerService';

type SaleType = 'FAC' | 'REMITO' | 'TICKET' | 'PRESUPUESTO';
type PaymentMethod = 'CASH' | 'TRANSFER' | 'QR' | 'DEBIT' | 'CREDIT' | 'ACCOUNT';
type PaymentMethodUI = PaymentMethod | 'CONSUMIDOR_FINAL';

interface CartItem extends SaleItem {
  product: Product;
}

const DEFAULT_SALE_TYPE: SaleType = 'TICKET';
const DEFAULT_PAYMENT_METHOD: PaymentMethodUI = 'CASH';
const SALES_CART_STORAGE_KEY = 'sales:cart:v1';
const FIXED_IVA_PERCENT = 21;

const CONSUMIDOR_FINAL_VALUE = 'CONSUMIDOR_FINAL';

const isWeightedProduct = (product: Product) =>
  Boolean(product.esAlPeso || product.unidadMedida === 'KG' || product.unit?.toUpperCase() === 'KILO');

const getSaleUnit = (product: Product) => (isWeightedProduct(product) ? 'GR' : 'UNIDAD');

const getSaleUnitPrice = (product: Product) => (isWeightedProduct(product) ? Number(product.salePrice) / 1000 : Number(product.salePrice));

const normalizeCartItem = (item: CartItem): CartItem => {
  const saleUnit = item.saleUnit ?? getSaleUnit(item.product);
  const unitPrice = saleUnit === 'GR' ? getSaleUnitPrice(item.product) : item.unitPrice ?? Number(item.product.salePrice);

  return { ...item, saleUnit, unitPrice };
};

const getCustomerDisplayName = (customer: Customer) => {
  if (customer.businessName?.trim()) return customer.businessName;
  const fullName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
  return fullName || customer.id;
};

export default function SalesPage() {
  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(CONSUMIDOR_FINAL_VALUE);
  const [saleType, setSaleType] = useState<SaleType>(DEFAULT_SALE_TYPE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodUI>(DEFAULT_PAYMENT_METHOD);
  const [allowPriceOverride, setAllowPriceOverride] = useState(false);
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState(String(FIXED_IVA_PERCENT));
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageSeverity, setMessageSeverity] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [retrySaleId, setRetrySaleId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawCart = window.localStorage.getItem(SALES_CART_STORAGE_KEY);
      if (!rawCart) return;

      const parsedCart = JSON.parse(rawCart) as CartItem[];
      if (Array.isArray(parsedCart)) {
        setCart(parsedCart.map(normalizeCartItem));
      }
    } catch {
      window.localStorage.removeItem(SALES_CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (cart.length === 0) {
      window.localStorage.removeItem(SALES_CART_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SALES_CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    productService.searchProducts(query.trim(), 10).then(setResults).catch(() => setResults([]));
  }, [query]);

  useEffect(() => {
    const queryText = customerSearch.trim();
    if (queryText.length < 2) {
      setCustomerOptions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      partnerService
        .getCustomers({ search: queryText, limit: 20 })
        .then((result) => {
          setCustomerOptions(result.customers ?? []);
        })
        .catch(() => {
          setCustomerOptions([]);
        });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [customerSearch]);

  const selectedCustomer = useMemo(
    () => customerOptions.find((customer) => customer.id === selectedCustomerId),
    [customerOptions, selectedCustomerId]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * (item.unitPrice ?? getSaleUnitPrice(item.product)), 0),
    [cart]
  );
  const discountPercent = Number(discount || 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxAmount = subtotal * (FIXED_IVA_PERCENT / 100);
  const total = subtotal - discountAmount + taxAmount;

  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) => (item.product.id === product.id ? normalizeCartItem({ ...item, quantity: item.quantity + 1 }) : normalizeCartItem(item)));
      }

      return [
        ...current,
        {
          product,
          productId: product.id,
          quantity: 1,
          unitPrice: getSaleUnitPrice(product),
          saleUnit: getSaleUnit(product)
        }
      ];
    });
    setQuery('');
    setResults([]);
  };

  const addByBarcode = async () => {
    if (!barcode.trim()) return;
    const product = await productService.getProductByBarcode(barcode.trim());
    addProduct(product);
    setBarcode('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((current) =>
      current
        .map((item) => (item.product.id === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const updatePrice = (productId: string, unitPrice: number) => {
    setCart((current) => current.map((item) => (item.product.id === productId ? { ...item, unitPrice } : item)));
  };

  const removeItem = (productId: string) => setCart((current) => current.filter((item) => item.product.id !== productId));

  const downloadSaleReceipt = async (saleId: string) => {
    const { blob, fileName } = await salesService.downloadTicketPdf(saleId);
    const objectUrl = window.URL.createObjectURL(blob);

    try {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      window.URL.revokeObjectURL(objectUrl);
    }
  };

  const resetSaleForm = () => {
    setCart([]);
    setSelectedCustomerId(CONSUMIDOR_FINAL_VALUE);
    setCustomerSearch('');
    setCustomerOptions([]);
    setDiscount('0');
    setTax(String(FIXED_IVA_PERCENT));
    setNotes('');
  };

  const handleRetryDownload = async () => {
    if (!retrySaleId) return;

    try {
      setLoadingTicket(true);
      await downloadSaleReceipt(retrySaleId);
      setMessage('Comprobante descargado correctamente.');
      setMessageSeverity('success');
      setRetrySaleId(null);
    } catch (error) {
      const backendMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.response?.data?.error
        : null;
      setMessage(backendMessage || 'La venta fue registrada correctamente. No fue posible descargar el comprobante.');
      setMessageSeverity('warning');
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleConfirmSale = async () => {
    try {
      setMessage(null);
      setRetrySaleId(null);
      setLoadingTicket(true);
      const isConsumidorFinal = selectedCustomerId === CONSUMIDOR_FINAL_VALUE || paymentMethod === CONSUMIDOR_FINAL_VALUE;
      const effectivePaymentMethod: PaymentMethod = paymentMethod === CONSUMIDOR_FINAL_VALUE ? 'CASH' : paymentMethod;
      const effectiveDiscount = isConsumidorFinal ? 0 : discountAmount;

      const sale = await salesService.confirmSale({
        customerId: isConsumidorFinal ? undefined : selectedCustomerId || undefined,
        saleType,
        paymentMethod: effectivePaymentMethod,
        subtotal,
        discount: effectiveDiscount,
        tax: taxAmount,
        total,
        notes,
        allowPriceOverride,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          saleUnit: item.saleUnit,
          discount: 0,
          tax: 0
        }))
      });

      resetSaleForm();

      try {
        await downloadSaleReceipt(sale.id);
        setMessage('Venta confirmada y comprobante descargado correctamente.');
        setMessageSeverity('success');
      } catch (downloadError) {
        const backendMessage = axios.isAxiosError(downloadError)
          ? downloadError.response?.data?.message || downloadError.response?.data?.error
          : null;

        setMessage(backendMessage || 'La venta fue registrada correctamente. No fue posible descargar el comprobante.');
        setMessageSeverity('warning');
        setRetrySaleId(sale.id);
      }
    } catch (error) {
      const backendMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.response?.data?.error
        : null;

      setMessage(backendMessage || 'No se pudo confirmar la venta. Verifica autenticación y stock.');
      setMessageSeverity('error');
    } finally {
      setLoadingTicket(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Ventas</Typography>
          <Typography color="text.secondary">Venta rápida, lector de código de barras, descuentos, medios de pago y ticket.</Typography>
        </Box>

        {message ? (
          <Alert
            severity={messageSeverity}
            action={
              retrySaleId ? (
                <Button color="inherit" size="small" onClick={handleRetryDownload} disabled={loadingTicket}>
                  Descargar nuevamente
                </Button>
              ) : undefined
            }
          >
            {message}
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack spacing={2}>
                <TextField fullWidth label="Buscar por nombre o código" value={query} onChange={(e) => setQuery(e.target.value)} InputProps={{ startAdornment: <SearchIcon /> }} />
                <TextField fullWidth label="Código de barras" value={barcode} onChange={(e) => setBarcode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addByBarcode()} />
              </Stack>
            </Paper>

            {results.length > 0 ? (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Resultados</Typography>
                <Grid container spacing={1}>
                  {results.map((product) => (
                    <Grid item xs={12} key={product.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{product.name}</Typography>
                          <Typography variant="caption">{product.internalCode} - ${Number(product.salePrice).toFixed(2)}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                            {isWeightedProduct(product) ? 'Venta por peso' : 'Venta por unidad'}
                          </Typography>
                        </Box>
                        <Button size="small" startIcon={<AddIcon />} onClick={() => addProduct(product)}>Agregar</Button>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ) : null}

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Carrito</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="right">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{item.product.name}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                            sx={{ width: 132, '& .MuiInputBase-input': { fontSize: '0.95rem' } }}
                            inputProps={{ min: 1, step: 1 }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {(item.saleUnit ?? getSaleUnit(item.product)) === 'GR' ? 'g' : 'u'}
                                </InputAdornment>
                              )
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={(item.saleUnit ?? getSaleUnit(item.product)) === 'GR' ? Number(item.product.salePrice) : item.unitPrice}
                            onChange={(e) => updatePrice(item.product.id, Number(e.target.value))}
                            sx={{ width: 132, '& .MuiInputBase-input': { fontSize: '0.95rem' } }}
                            disabled={(item.saleUnit ?? getSaleUnit(item.product)) === 'GR' || !allowPriceOverride}
                            inputProps={{ min: 0, step: '0.01' }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {(item.saleUnit ?? getSaleUnit(item.product)) === 'GR' ? '$/kg' : '$/u'}
                                </InputAdornment>
                              )
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">{(item.quantity * (item.unitPrice ?? getSaleUnitPrice(item.product))).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => removeItem(item.product.id)} size="small"><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack spacing={2}>
                <TextField select label="Tipo de venta" value={saleType} onChange={(e) => setSaleType(e.target.value as SaleType)}>
                  <MenuItem value="TICKET">Ticket</MenuItem>
                  <MenuItem value="FAC">Factura</MenuItem>
                  <MenuItem value="REMITO">Remito</MenuItem>
                  <MenuItem value="PRESUPUESTO">Presupuesto</MenuItem>
                </TextField>
                <TextField select label="Medio de pago" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                  <MenuItem value="CASH">Efectivo</MenuItem>
                  <MenuItem value="DEBIT">Débito</MenuItem>
                  <MenuItem value="CREDIT">Crédito</MenuItem>
                  <MenuItem value="TRANSFER">Transferencia</MenuItem>
                  <MenuItem value="QR">QR</MenuItem>
                  <MenuItem value="ACCOUNT">Cuenta corriente</MenuItem>
                  <MenuItem value={CONSUMIDOR_FINAL_VALUE}>Consumidor final</MenuItem>
                </TextField>
                <TextField
                  label="Buscar cliente por nombre o razón social"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    )
                  }}
                  helperText="Escribí al menos 2 caracteres"
                  disabled={paymentMethod === CONSUMIDOR_FINAL_VALUE}
                />
                <TextField
                  select
                  label="Cliente"
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedCustomerId(nextId);

                    if (nextId === CONSUMIDOR_FINAL_VALUE) {
                      setDiscount('0');
                      return;
                    }

                    const customer = customerOptions.find((item) => item.id === nextId);
                    if (customer) {
                      setDiscount(String(Number(customer.discount ?? 0)));
                    }
                  }}
                  disabled={paymentMethod === CONSUMIDOR_FINAL_VALUE}
                >
                  <MenuItem value={CONSUMIDOR_FINAL_VALUE}>Consumidor final (sin datos)</MenuItem>
                  {customerOptions.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {getCustomerDisplayName(customer)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField label="Descuento (%)" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} helperText="Se aplica sobre el subtotal" />
                <TextField label="IVA" type="number" value={tax} InputProps={{ readOnly: true }} helperText="Fijo 21%" />
                <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={3} />
                <Button variant={allowPriceOverride ? 'contained' : 'outlined'} onClick={() => setAllowPriceOverride(!allowPriceOverride)}>
                  {allowPriceOverride ? 'Precio editable' : 'Bloquear precio'}
                </Button>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Typography>Subtotal: ${subtotal.toFixed(2)}</Typography>
                <Typography>Descuento ({discountPercent || 0}%): ${discountAmount.toFixed(2)}</Typography>
                <Typography>IVA (21%): ${taxAmount.toFixed(2)}</Typography>
                <Typography variant="h6">Total: ${total.toFixed(2)}</Typography>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={handleConfirmSale} disabled={cart.length === 0 || loadingTicket}>
                  {loadingTicket ? 'Procesando...' : 'Confirmar y descargar'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
