import { useEffect, useRef } from 'react';
import { Box, Button, TextField, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useGenerateLabels } from '../hooks/useProducts';

interface LabelsViewerProps {
  productIds: string[];
  quantity?: number;
}

export function LabelsViewer({ productIds, quantity = 1 }: LabelsViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const generateLabels = useGenerateLabels();

  useEffect(() => {
    if (productIds.length > 0) {
      generateLabels.mutate({ productIds, quantity });
    }
  }, [productIds, quantity]);

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };

  const handleDownload = () => {
    if (generateLabels.data) {
      const blob = new Blob([generateLabels.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'etiquetas.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={!generateLabels.data}
        >
          Imprimir
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={!generateLabels.data}
        >
          Descargar HTML
        </Button>
      </Box>

      {generateLabels.isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {generateLabels.isError && <Alert severity="error">Error al generar etiquetas</Alert>}

      {generateLabels.data && (
        <iframe
          ref={iframeRef}
          srcDoc={generateLabels.data}
          style={{
            width: '100%',
            height: '600px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      )}
    </Box>
  );
}
