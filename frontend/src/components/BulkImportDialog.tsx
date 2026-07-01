import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Typography,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { useBulkImportProducts } from '../hooks/useProducts';

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BulkImportDialog({ open, onClose }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importResults, setImportResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const bulkImport = useBulkImportProducts();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResults(null);
    }
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
      const product: any = {};

      headers.forEach((header, index) => {
        product[header] = values[index];
      });

      products.push(product);
    }

    return products;
  };

  const handleImport = async () => {
    if (!file) {
      alert('Selecciona un archivo');
      return;
    }

    setIsProcessing(true);
    try {
      const content = await file.text();
      const products = parseCSV(content);

      if (products.length === 0) {
        alert('No se encontraron productos en el archivo');
        setIsProcessing(false);
        return;
      }

      const results = await bulkImport.mutateAsync({
        products,
        updateExisting
      });

      setImportResults(results);
    } catch (error: any) {
      alert(`Error importando archivo: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const templateContent = `"Código Interno","Código de Barras","Nombre","Descripción","Marca","Categoría","Subcategoría","Proveedor","Costo","Precio de Venta","IVA %","Margen %","Stock","Stock Mínimo","Stock Máximo","Unidad","Ubicación","Peso","Imagen Principal","Galería","Activo"
"P001","7790000000017","Producto de ejemplo A","Descripcion general del producto","Marca Demo","Categoria General","Subcategoria A","Proveedor Demo SA","120000","185000","21","35","12","5","30","UNIDAD","Deposito 1","3.4","https://example.com/image.jpg","https://example.com/img1.jpg","true"`;

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_productos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setImportResults(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Importar Productos en Lote</DialogTitle>
      <DialogContent>
        {!importResults ? (
          <Box sx={{ pt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{ mb: 2 }}
            >
              Descargar Plantilla
            </Button>

            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed #ccc',
                cursor: 'pointer',
                mb: 2,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              <input
                hidden
                accept=".csv,.xlsx"
                type="file"
                id="file-upload"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography>
                  {file ? `Archivo: ${file.name}` : 'Arrastra o haz clic para seleccionar archivo'}
                </Typography>
              </label>
            </Paper>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Checkbox
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
              />
              <Typography>Actualizar productos existentes</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ pt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Importación completada
            </Alert>

            <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
              <Typography variant="body2">
                <strong>Creados:</strong> {importResults.created}
              </Typography>
              <Typography variant="body2">
                <strong>Actualizados:</strong> {importResults.updated}
              </Typography>
              <Typography variant="body2" color="error">
                <strong>Errores:</strong> {importResults.errors?.length || 0}
              </Typography>
            </Paper>

            {importResults.errors && importResults.errors.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Errores en la importación:
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {importResults.errors.map((error: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ErrorIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Fila ${error.row}`}
                        secondary={error.error}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{importResults ? 'Cerrar' : 'Cancelar'}</Button>
        {!importResults && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!file || isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} /> : undefined}
          >
            Importar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
