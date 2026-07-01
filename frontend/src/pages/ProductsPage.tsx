import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Autocomplete,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  CircularProgress,
  Alert,
  Pagination,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useSearchProducts,
  useGenerateLabels,
  useBulkImportProducts
} from '../hooks/useProducts';
import { productService, Product, ProductFilter } from '../services/productService';
import { uploadService } from '../services/uploadService';

const getDefaultProductFormData = (): Partial<Product> => ({
  internalCode: undefined,
  name: '',
  salePrice: undefined,
  cost: undefined,
  margin: 0,
  stock: undefined,
  minStock: undefined,
  maxStock: undefined,
  iva: 21,
  unit: 'UNIDAD',
  isActive: true,
  mainImage: ''
});

const parseDecimalInput = (value: string): number | undefined => {
  const normalized = value
    .replace(',', '.')
    .replace(/[^\d.]/g, '')
    .replace(/(\..*)\./g, '$1');

  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseIntegerInput = (value: string): number | undefined => {
  const normalized = value.replace(/\D/g, '');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const calculateMargin = (cost: number, salePrice: number) => {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  const margin = ((salePrice - cost) / cost) * 100;
  return Number.isFinite(margin) ? Number(margin.toFixed(2)) : 0;
};

interface CategoryOption {
  id: string;
  name: string;
}

interface SubcategoryOption {
  id: string;
  name: string;
  categoryId?: string;
}

interface SupplierOption {
  id: string;
  businessName: string;
}

type QuickFilter = 'all' | 'no-stock' | 'critical-stock' | 'available-stock' | 'active' | 'inactive';
type SortField = 'name' | 'internalCode' | 'salePrice' | 'stock' | 'stockState' | 'category';
type SortOrder = 'asc' | 'desc';
type StockState = 'NO_STOCK' | 'CRITICAL' | 'AVAILABLE';

const QUICK_FILTER_SESSION_KEY = 'products.quick-filter';

const getStockState = (product: Product): StockState => {
  if (product.stock <= 0) return 'NO_STOCK';
  if (product.stock <= product.minStock) return 'CRITICAL';
  return 'AVAILABLE';
};

const stockStateRank: Record<StockState, number> = {
  NO_STOCK: 0,
  CRITICAL: 1,
  AVAILABLE: 2
};

const stockStateChipProps: Record<StockState, { label: string; color: 'error' | 'warning' | 'success' }> = {
  NO_STOCK: { label: 'Sin Stock', color: 'error' },
  CRITICAL: { label: 'Critico', color: 'warning' },
  AVAILABLE: { label: 'Disponible', color: 'success' }
};

const quickFilterLabels: Record<QuickFilter, string> = {
  all: 'Todos',
  'no-stock': 'Sin Stock',
  'critical-stock': 'Stock Critico',
  'available-stock': 'Stock Disponible',
  active: 'Activos',
  inactive: 'Inactivos'
};

const resolveProductImageUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) {
    return url;
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  const apiOrigin = apiUrl.replace(/\/api\/?$/, '');
  return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function ProductsPage() {
  const [filter, setFilter] = useState<ProductFilter>({ page: 1, limit: 10, isActive: true });
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(() => {
    if (typeof window === 'undefined') return 'all';
    const saved = window.sessionStorage.getItem(QUICK_FILTER_SESSION_KEY);
    if (saved === 'all' || saved === 'no-stock' || saved === 'critical-stock' || saved === 'available-stock' || saved === 'active' || saved === 'inactive') {
      return saved;
    }
    return 'all';
  });
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
    name: string;
  }>({ open: false, id: null, name: '' });

  const { data: productsData, isLoading, error, refetch } = useProducts(filter);
  const { data: searchResults } = useSearchProducts(searchQuery);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(editingProduct?.id || '');
  const deleteProduct = useDeleteProduct();
  const generateLabels = useGenerateLabels();
  const bulkImport = useBulkImportProducts();

  const handleOpenForm = (product?: Product) => {
    // Prevent focused trigger button from staying focused while MUI hides the app root.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingProduct(null);
  };

  const openDeleteDialog = (product: Product) => {
    setDeleteDialog({
      open: true,
      id: product.id,
      name: product.name
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, id: null, name: '' });
  };

  const handleDeleteProduct = async () => {
    if (!deleteDialog.id) return;

    try {
      await deleteProduct.mutateAsync(deleteDialog.id);
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handlePrintLabels = async () => {
    if (selectedProducts.length === 0) {
      alert('Selecciona al menos un producto');
      return;
    }
    try {
      const html = await generateLabels.mutateAsync({ productIds: selectedProducts });
      const window2 = window.open('', '', 'width=800,height=600');
      window2?.document.write(html);
      window2?.document.close();
      window2?.print();
    } catch (error) {
      console.error('Error generating labels:', error);
    }
  };

  const handleFilterChange = (newFilter: Partial<ProductFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter, page: 1 }));
  };

  const handlePageChange = (event: any, newPage: number) => {
    setFilter((prev) => ({ ...prev, page: newPage }));
  };

  const handleImportTemplate = async () => {
    try {
      const template = await productService.getImportTemplate();
      const blob = new Blob([template], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_productos.csv';
      a.click();
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(QUICK_FILTER_SESSION_KEY, quickFilter);
    }
  }, [quickFilter]);

  const products = useMemo(() => {
    const sourceProducts = searchQuery && searchResults ? searchResults : productsData?.data || [];

    const filtered = sourceProducts.filter((product) => {
      const stockState = getStockState(product);
      if (quickFilter === 'all') return true;
      if (quickFilter === 'no-stock') return product.stock === 0;
      if (quickFilter === 'critical-stock') return stockState === 'CRITICAL';
      if (quickFilter === 'available-stock') return stockState === 'AVAILABLE';
      if (quickFilter === 'active') return product.isActive;
      if (quickFilter === 'inactive') return !product.isActive;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (sortField === 'internalCode') {
        comparison = (a.internalCode || '').localeCompare(b.internalCode || '', 'es', { sensitivity: 'base' });
      } else if (sortField === 'salePrice') {
        comparison = a.salePrice - b.salePrice;
      } else if (sortField === 'stock') {
        comparison = a.stock - b.stock;
      } else if (sortField === 'stockState') {
        comparison = stockStateRank[getStockState(a)] - stockStateRank[getStockState(b)];
      } else if (sortField === 'category') {
        comparison = (a.category?.name || '').localeCompare(b.category?.name || '', 'es', { sensitivity: 'base' });
      }

      if (comparison === 0) {
        comparison = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [productsData?.data, searchQuery, searchResults, quickFilter, sortField, sortOrder]);

  const quickFilterCounts = useMemo(() => {
    const sourceProducts = searchQuery && searchResults ? searchResults : productsData?.data || [];

    const counts: Record<QuickFilter, number> = {
      all: sourceProducts.length,
      'no-stock': 0,
      'critical-stock': 0,
      'available-stock': 0,
      active: 0,
      inactive: 0
    };

    sourceProducts.forEach((product) => {
      const stockState = getStockState(product);
      if (product.stock === 0) counts['no-stock'] += 1;
      if (stockState === 'CRITICAL') counts['critical-stock'] += 1;
      if (stockState === 'AVAILABLE') counts['available-stock'] += 1;
      if (product.isActive) counts.active += 1;
      if (!product.isActive) counts.inactive += 1;
    });

    return counts;
  }, [productsData?.data, searchQuery, searchResults]);

  const summaryStats = useMemo(() => {
    const sourceProducts = searchQuery && searchResults ? searchResults : productsData?.data || [];
    const stats = {
      totalProducts: sourceProducts.length,
      withStock: 0,
      criticalStock: 0,
      noStock: 0,
      inventoryValue: 0
    };

    sourceProducts.forEach((product) => {
      const stockState = getStockState(product);
      if (stockState === 'AVAILABLE') stats.withStock += 1;
      if (stockState === 'CRITICAL') stats.criticalStock += 1;
      if (stockState === 'NO_STOCK') stats.noStock += 1;
      stats.inventoryValue += product.stock * product.cost;
    });

    return stats;
  }, [productsData?.data, searchQuery, searchResults]);

  const totalPages = productsData ? Math.ceil(productsData.total / (filter.limit || 10)) : 1;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box component="h1" sx={{ m: 0, fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Gestion de Productos
          </Box>
          <Box component="p" sx={{ m: 0, mt: 0.5, color: 'text.secondary' }}>
            Administra catalogo, precios y stock minimo con estilo de panel moderno.
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
            Nuevo Producto
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleImportTemplate}>
            Plantilla
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintLabels} disabled={selectedProducts.length === 0}>
            Imprimir Etiquetas
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />

          <Box
            sx={{
              mt: 2,
              p: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) => `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
              <ToggleButtonGroup
                exclusive
                value={quickFilter}
                onChange={(_, value: QuickFilter | null) => {
                  if (!value) return;
                  setQuickFilter(value);
                }}
                size="small"
                sx={{ flexWrap: 'wrap', gap: 0.8 }}
              >
                {(Object.keys(quickFilterLabels) as QuickFilter[]).map((key) => (
                  <ToggleButton key={key} value={key} sx={{ borderRadius: 999, px: 1.4, textTransform: 'none', fontWeight: 700 }}>
                    {`${quickFilterLabels[key]} (${quickFilterCounts[key]})`}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Box sx={{ display: 'flex', gap: 1, minWidth: { xs: '100%', md: 360 } }}>
                <TextField
                  select
                  size="small"
                  label="Ordenar por"
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value as SortField)}
                  sx={{ minWidth: 190, flex: 1 }}
                >
                  <MenuItem value="name">Nombre</MenuItem>
                  <MenuItem value="internalCode">Codigo</MenuItem>
                  <MenuItem value="salePrice">Precio</MenuItem>
                  <MenuItem value="stock">Stock</MenuItem>
                  <MenuItem value="stockState">Estado de Stock</MenuItem>
                  <MenuItem value="category">Categoria</MenuItem>
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Orden"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="asc">Ascendente</MenuItem>
                  <MenuItem value="desc">Descendente</MenuItem>
                </TextField>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          mb: 3,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            xl: 'repeat(5, minmax(0, 1fr))'
          }
        }}
      >
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>Total de productos</Box>
            <Box sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{summaryStats.totalProducts}</Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ color: 'success.main', fontSize: 12, fontWeight: 700 }}>Con stock</Box>
            <Box sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{summaryStats.withStock}</Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ color: 'warning.main', fontSize: 12, fontWeight: 700 }}>Stock critico</Box>
            <Box sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{summaryStats.criticalStock}</Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ color: 'error.main', fontSize: 12, fontWeight: 700 }}>Sin stock</Box>
            <Box sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{summaryStats.noStock}</Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700 }}>Valor inventario</Box>
            <Box sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>${summaryStats.inventoryValue.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</Box>
          </CardContent>
        </Card>
      </Box>

      {error && <Alert severity="error">Error al cargar productos</Alert>}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Imagen</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Estado Stock</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>IVA</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const stockState = getStockState(product);

                  return <TableRow key={product.id}>
                    <TableCell>
                      {product.mainImage ? (
                        <Box
                          component="img"
                          src={resolveProductImageUrl(product.mainImage)}
                          alt={product.name}
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            objectFit: 'cover',
                            border: '1px solid',
                            borderColor: 'divider',
                            backgroundColor: 'action.hover'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            display: 'grid',
                            placeItems: 'center',
                            border: '1px dashed',
                            borderColor: 'divider',
                            color: 'text.secondary',
                            fontSize: 11,
                            backgroundColor: 'action.hover'
                          }}
                        >
                          Sin
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{product.internalCode}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>
                      <Chip label={product.stock} variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stockStateChipProps[stockState].label}
                        color={stockStateChipProps[stockState].color}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>${product.salePrice.toFixed(2)}</TableCell>
                    <TableCell>{product.iva}%</TableCell>
                    <TableCell>
                      <Chip
                        label={product.isActive ? 'Activo' : 'Inactivo'}
                        color={product.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleOpenForm(product)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => openDeleteDialog(product)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>;
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {!searchQuery && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={totalPages} page={filter.page || 1} onChange={handlePageChange} />
            </Box>
          )}
        </>
      )}

      <ProductFormDialog open={openForm} onClose={handleCloseForm} product={editingProduct} />

      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el producto {deleteDialog.name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteProduct.isPending}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeleteProduct} disabled={deleteProduct.isPending}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

function ProductFormDialog({ open, onClose, product }: ProductFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Product>>(getDefaultProductFormData());
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct(product?.id || '');

  useEffect(() => {
    if (!open) return;
    setSaveError(null);

    if (product) {
      setFormData({
        ...product,
        categoryId: product.category?.id,
        subcategoryId: product.subcategory?.id,
        supplierId: product.supplier?.id
      });
      return;
    }

    setFormData(getDefaultProductFormData());
  }, [open, product]);

  useEffect(() => {
    if (!open) return;

    const loadFormCatalogs = async () => {
      try {
        const options = await productService.getFormOptions();
        setCategories(options.categories ?? []);
        setSubcategories(options.subcategories ?? []);
        setSuppliers(options.suppliers ?? []);
      } catch (catalogError) {
        console.error('Error loading product form catalogs:', catalogError);
      }
    };

    loadFormCatalogs();
  }, [open]);

  useEffect(() => {
    const cost = Number(formData.cost ?? 0);
    const salePrice = Number(formData.salePrice ?? 0);
    const nextMargin = calculateMargin(cost, salePrice);

    if (Number(formData.margin ?? 0) !== nextMargin) {
      setFormData((current) => ({ ...current, margin: nextMargin }));
    }
  }, [formData.cost, formData.salePrice]);

  const filteredSubcategories = subcategories.filter((item) => !formData.categoryId || item.categoryId === formData.categoryId);
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  const sortedSubcategories = [...filteredSubcategories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  const selectedCategory = sortedCategories.find((item) => item.id === formData.categoryId) ?? null;
  const selectedSubcategory = sortedSubcategories.find((item) => item.id === formData.subcategoryId) ?? null;
  const supplierValue = formData.supplierId && suppliers.some((item) => item.id === formData.supplierId) ? formData.supplierId : '';

  const handleSubmit = async () => {
    setSaveError(null);
    try {
      const payload = { ...formData, iva: 21 };
      if (product) {
        await updateProduct.mutateAsync(payload as any);
      } else {
        await createProduct.mutateAsync(payload as any);
      }
      onClose();
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.response?.data?.error || 'Error al guardar producto'
        : 'Error al guardar producto';

      const details = axios.isAxiosError(error) && Array.isArray(error.response?.data?.errors)
        ? `: ${error.response?.data?.errors.join(', ')}`
        : '';

      const finalMessage = `${message}${details}`;
      setSaveError(finalMessage);
      console.error('Error saving product:', finalMessage, error);
    }
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await uploadService.uploadImage(file);
      setFormData((current) => ({ ...current, mainImage: result.url }));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box sx={{ p: 3 }}>
        <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        {saveError ? <Alert severity="error" sx={{ mt: 1 }}>{saveError}</Alert> : null}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Código Interno"
              value={formData.internalCode || ''}
              placeholder={product ? '' : 'Se genera automáticamente al crear'}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Costo"
              type="text"
              inputProps={{ inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*' }}
              value={formData.cost ?? ''}
              onChange={(e) => setFormData({
                ...formData,
                cost: parseDecimalInput(e.target.value)
              })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Precio de Venta"
              type="text"
              inputProps={{ inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*' }}
              value={formData.salePrice ?? ''}
              onChange={(e) => setFormData({
                ...formData,
                salePrice: parseDecimalInput(e.target.value)
              })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Margen %"
              type="text"
              value={formData.margin ?? 0}
              InputProps={{ readOnly: true }}
              helperText="Calculado automaticamente"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="IVA %"
              type="text"
              value={21}
              InputProps={{ readOnly: true }}
              helperText="Fijo 21%"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Unidad"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <MenuItem value="UNIDAD">Unidad</MenuItem>
              <MenuItem value="METRO">Metro</MenuItem>
              <MenuItem value="KILO">Kilo</MenuItem>
              <MenuItem value="LITRO">Litro</MenuItem>
              <MenuItem value="CAJA">Caja</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Stock"
              type="text"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              value={formData.stock ?? ''}
              InputProps={{ readOnly: true }}
              helperText="Se actualiza desde Compras o Stock"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Stock minimo"
              type="text"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              value={formData.minStock ?? ''}
              onChange={(e) => setFormData({ ...formData, minStock: parseIntegerInput(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Stock maximo"
              type="text"
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
              value={formData.maxStock ?? ''}
              onChange={(e) => setFormData({ ...formData, maxStock: parseIntegerInput(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={sortedCategories}
              value={selectedCategory}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) =>
                setFormData({
                  ...formData,
                  categoryId: value?.id,
                  subcategoryId: undefined
                })
              }
              renderInput={(params) => <TextField {...params} label="Categoria" placeholder="Buscar categoria" fullWidth />}
              ListboxProps={{ style: { maxHeight: 280 } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={sortedSubcategories}
              value={selectedSubcategory}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => setFormData({ ...formData, subcategoryId: value?.id })}
              renderInput={(params) => <TextField {...params} label="Subcategoria" placeholder="Buscar subcategoria" fullWidth />}
              ListboxProps={{ style: { maxHeight: 280 } }}
              disabled={sortedSubcategories.length === 0}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              select
              label="Proveedor"
              value={supplierValue}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value || undefined })}
            >
              <MenuItem value="">Automatico</MenuItem>
              {suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>{supplier.businessName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Imagen principal (URL)"
              value={formData.mainImage || ''}
              onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button component="label" variant="outlined" disabled={uploadingImage}>
              {uploadingImage ? 'Subiendo imagen...' : 'Cargar imagen'}
              <input hidden type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
            </Button>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createProduct.isPending || updateProduct.isPending}
          >
            {product ? 'Actualizar' : 'Crear'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
