import { useState } from 'react';
import {
  Autocomplete,
  Box,
  TextField,
  Button,
  Collapse,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Slider,
  Typography
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { ProductFilter } from '../services/productService';

interface ProductFiltersProps {
  onFilterChange: (filter: Partial<ProductFilter>) => void;
  categories?: Array<{ id: string; name: string }>;
  suppliers?: Array<{ id: string; businessName: string }>;
}

export function ProductFilters({ onFilterChange, categories = [], suppliers = [] }: ProductFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<ProductFilter>({
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const handleFilterChange = (key: keyof ProductFilter, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = (event: Event, newValue: number | number[]) => {
    const range = newValue as [number, number];
    setPriceRange(range);
    handleFilterChange('minPrice', range[0]);
    handleFilterChange('maxPrice', range[1]);
  };

  const handleClearFilters = () => {
    setFilters({ isActive: true, sortBy: 'name', sortOrder: 'asc' });
    setPriceRange([0, 100000]);
    onFilterChange({ isActive: true });
  };

  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  const selectedCategory = sortedCategories.find((cat) => cat.id === filters.categoryId) ?? null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setExpanded(!expanded)}>
          <Typography variant="h6">Filtros Avanzados</Typography>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={sortedCategories}
                  value={selectedCategory}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, value) => handleFilterChange('categoryId', value?.id || undefined)}
                  renderInput={(params) => <TextField {...params} label="Categoría" placeholder="Todas" fullWidth />}
                  ListboxProps={{ style: { maxHeight: 280 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Proveedor"
                  value={filters.supplierId || ''}
                  onChange={(e) => handleFilterChange('supplierId', e.target.value || undefined)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {suppliers.map((sup) => (
                    <MenuItem key={sup.id} value={sup.id}>
                      {sup.businessName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Unidad"
                  value={filters.unit || ''}
                  onChange={(e) => handleFilterChange('unit', e.target.value || undefined)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="UNIDAD">Unidad</MenuItem>
                  <MenuItem value="METRO">Metro</MenuItem>
                  <MenuItem value="KILO">Kilo</MenuItem>
                  <MenuItem value="LITRO">Litro</MenuItem>
                  <MenuItem value="CAJA">Caja</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Ordenar por"
                  value={filters.sortBy || 'name'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
                >
                  <MenuItem value="name">Nombre</MenuItem>
                  <MenuItem value="price">Precio</MenuItem>
                  <MenuItem value="stock">Stock</MenuItem>
                  <MenuItem value="createdAt">Fecha de Creación</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Orden"
                  value={filters.sortOrder || 'asc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as any)}
                >
                  <MenuItem value="asc">Ascendente</MenuItem>
                  <MenuItem value="desc">Descendente</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Stock Mínimo"
                  value={filters.minStock || ''}
                  onChange={(e) => handleFilterChange('minStock', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <MenuItem value="">Cualquiera</MenuItem>
                  <MenuItem value="0">Bajo</MenuItem>
                  <MenuItem value="5">Medio</MenuItem>
                  <MenuItem value="10">Alto</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>
                  Rango de Precio: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                </Typography>
                <Slider
                  min={0}
                  max={100000}
                  step={1000}
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={handleClearFilters}>
                    Limpiar Filtros
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
