import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Paper,
  Grid,
  Typography,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useSearchProducts, useProductByBarcode } from '../hooks/useProducts';
import { Product } from '../services/productService';

interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
}

export function POSCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const { data: searchResults, isFetching } = useSearchProducts(searchQuery, searchQuery.length >= 3);
  const { data: barcodeProduct, refetch: fetchBarcode } = useProductByBarcode(barcodeInput, false);

  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems([...cartItems, { product, quantity: 1, unit: product.unit }]);
    }

    setSearchQuery('');
  };

  const handleBarcodeSearch = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput) {
      fetchBarcode();
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter((item) => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.salePrice * item.quantity,
    0
  );

  const tax = subtotal * 0.21; // IVA 21%
  const total = subtotal + tax;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Buscar productos por nombre, código o barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: isFetching && <CircularProgress size={20} />
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              placeholder="Escanear código de barras o presionar Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </CardContent>
        </Card>

        {(searchResults || barcodeProduct) && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Productos disponibles:
            </Typography>
            <Grid container spacing={1}>
              {((searchResults ?? []) as Product[])
                .concat(barcodeProduct ? [barcodeProduct] : [])
                .map((product) => (
                  <Grid item xs={12} key={product.id}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {product.name}
                        </Typography>
                        <Typography variant="caption">
                          Código: {product.internalCode}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">${product.salePrice.toFixed(2)}</Typography>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleAddToCart(product)}
                        >
                          Agregar
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Carrito ({cartItems.length} productos)
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Precio</TableCell>
                    <TableCell align="center">Cantidad</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell align="right">${item.product.salePrice.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.product.id, Number(e.target.value))}
                            sx={{ width: 60 }}
                            inputProps={{ min: 1 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        ${(item.product.salePrice * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFromCart(item.product.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resumen de Venta
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>${subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>IVA (21%):</Typography>
                <Typography>${tax.toFixed(2)}</Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 2,
                  pt: 1,
                  borderTop: '1px solid #ccc'
                }}
              >
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                  ${total.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              type="number"
              label="Descuento"
              placeholder="0"
              sx={{ mb: 2 }}
            />

            <Button fullWidth variant="contained" color="primary" size="large" disabled={cartItems.length === 0}>
              Completar Venta
            </Button>
            <Button fullWidth variant="outlined" sx={{ mt: 1 }}>
              Limpiar Carrito
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
