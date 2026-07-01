import { useState } from 'react';
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { uploadService } from '../services/uploadService';

export default function UploadsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  const handleUpload = async (file: File, kind: 'image' | 'pdf') => {
    const result = kind === 'image' ? await uploadService.uploadImage(file) : await uploadService.uploadPdf(file);
    if (kind === 'image') setImageUrl(result.url);
    if (kind === 'pdf') setPdfUrl(result.url);
    setMessage(`Archivo cargado: ${result.filename}`);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>Uploads</Typography>
          <Typography color="text.secondary">Carga de imágenes y PDF para recursos del ERP.</Typography>
        </Box>

        {message ? <Alert severity="success">{message}</Alert> : null}

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Subir imagen</Typography>
            <TextField
              type="file"
              inputProps={{ accept: 'image/*' }}
              onChange={(event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) handleUpload(file, 'image');
              }}
            />
            {imageUrl ? <Typography variant="body2">URL: {imageUrl}</Typography> : null}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Subir PDF</Typography>
            <TextField
              type="file"
              inputProps={{ accept: 'application/pdf' }}
              onChange={(event) => {
                const file = (event.target as HTMLInputElement).files?.[0];
                if (file) handleUpload(file, 'pdf');
              }}
            />
            {pdfUrl ? <Typography variant="body2">URL: {pdfUrl}</Typography> : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
