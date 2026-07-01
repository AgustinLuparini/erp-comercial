import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import { searchService, type GlobalSearchResult } from '../services/searchService';

export default function GlobalSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      searchService.search(query).then(setResults).catch(() => setResults([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [open, query]);

  const handleSelect = (href: string) => {
    onClose();
    navigate(href);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Búsqueda global</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ py: 1 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Buscar productos, clientes, proveedores o ventas"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>⌕</Box> }}
          />
          <Box sx={{ maxHeight: 460, overflow: 'auto' }}>
            {results.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Escribe al menos 2 caracteres para buscar.</Typography>
            ) : (
              <List disablePadding>
                {results.map((result) => (
                  <ListItemButton key={`${result.type}-${result.id}`} onClick={() => handleSelect(result.href)} divider>
                    <ListItemText
                      primary={result.title}
                      secondary={result.subtitle}
                    />
                    <Chip size="small" label={result.type} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
