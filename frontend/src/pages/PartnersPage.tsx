import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
  Stack
} from '@mui/material';
import {
  partnerService,
  type Customer,
  type CustomerType,
  type LegalEntityType,
  type Supplier,
  type VatCondition
} from '../services/partnerService';

type AlertState = {
  severity: 'success' | 'error' | 'warning';
  text: string;
} | null;

const CUSTOMER_TYPE_OPTIONS: Array<{ value: CustomerType; label: string }> = [
  { value: 'PERSONA_HUMANA', label: 'Persona Humana' },
  { value: 'EMPRESA', label: 'Empresa' }
];

const LEGAL_ENTITY_OPTIONS: Array<{ value: LegalEntityType; label: string }> = [
  { value: 'SAS', label: 'SAS' },
  { value: 'SRL', label: 'SRL' },
  { value: 'SA', label: 'SA' },
  { value: 'SAU', label: 'SAU' },
  { value: 'COOPERATIVA', label: 'Cooperativa' },
  { value: 'ASOCIACION_CIVIL', label: 'Asociación Civil' },
  { value: 'FUNDACION', label: 'Fundación' },
  { value: 'OTRO', label: 'Otro' }
];

const VAT_CONDITION_OPTIONS: Array<{ value: VatCondition; label: string }> = [
  { value: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
  { value: 'MONOTRIBUTISTA', label: 'Monotributista' },
  { value: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto' },
  { value: 'EXENTO', label: 'Exento' },
  { value: 'NO_RESPONSABLE', label: 'No Responsable' },
  { value: 'MONOTRIBUTO_SOCIAL', label: 'Monotributo Social' }
];

export default function PartnersPage() {
  const [tab, setTab] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerPage, setCustomerPage] = useState(0);
  const [supplierPage, setSupplierPage] = useState(0);
  const [customerRowsPerPage, setCustomerRowsPerPage] = useState(10);
  const [supplierRowsPerPage, setSupplierRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [message, setMessage] = useState<AlertState>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [deleteCustomerDialog, setDeleteCustomerDialog] = useState<{
    open: boolean;
    id: string | null;
    name: string;
  }>({ open: false, id: null, name: '' });

  const customerCacheRef = useRef<Map<string, { customers: Customer[]; total: number }>>(new Map());
  const supplierCacheRef = useRef<Map<string, { suppliers: Supplier[]; total: number }>>(new Map());

  const [customerForm, setCustomerForm] = useState<{
    customerType: CustomerType;
    vatCondition: VatCondition;
    taxId: string;
    firstName: string;
    lastName: string;
    businessName: string;
    legalEntityType: LegalEntityType;
    dni: string;
    email: string;
    phone: string;
    creditLimit: string;
    discount: string;
  }>({
    customerType: 'PERSONA_HUMANA',
    vatCondition: 'CONSUMIDOR_FINAL',
    taxId: '',
    firstName: '',
    lastName: '',
    businessName: '',
    legalEntityType: 'OTRO',
    dni: '',
    email: '',
    phone: '',
    creditLimit: '0',
    discount: '0'
  });

  const [supplierForm, setSupplierForm] = useState<{
    businessName: string;
    legalEntityType: string;
    taxId: string;
    email: string;
    phone: string;
    contact: string;
    city: string;
  }>({
    businessName: '',
    legalEntityType: '',
    taxId: '',
    email: '',
    phone: '',
    contact: '',
    city: ''
  });

  const toOptionalString = (value: string): string | undefined => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const toNumber = (value: string, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const buildCacheKey = (query: string, page: number, limit: number) => `${query}|${page}|${limit}`;

  const composeBusinessName = (name: string, legalEntityType: string): string | undefined => {
    const cleanName = name.trim();
    const cleanType = legalEntityType.trim();

    if (!cleanName) return undefined;
    if (!cleanType) return cleanName;
    if (cleanName.endsWith(`(${cleanType})`)) return cleanName;
    return `${cleanName} (${cleanType})`;
  };

  const splitBusinessName = (value?: string) => {
    return { name: (value ?? '').trim(), legalEntityType: '' };
  };

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    const key = buildCacheKey(debouncedSearch, customerPage + 1, customerRowsPerPage);
    const cached = customerCacheRef.current.get(key);

    if (cached) {
      setCustomers(cached.customers);
      setTotalCustomers(cached.total);
      setLoadingCustomers(false);
      return;
    }

    try {
      const customerResult = await partnerService.getCustomers({
        search: debouncedSearch,
        page: customerPage + 1,
        limit: customerRowsPerPage
      });
      const nextCustomers = customerResult.customers ?? [];
      const nextTotal = Number(customerResult.total ?? 0);

      setCustomers(nextCustomers);
      setTotalCustomers(nextTotal);
      customerCacheRef.current.set(key, { customers: nextCustomers, total: nextTotal });
    } catch {
      setMessage({ severity: 'warning', text: 'No se pudieron cargar los clientes.' });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    const key = buildCacheKey(debouncedSearch, supplierPage + 1, supplierRowsPerPage);
    const cached = supplierCacheRef.current.get(key);

    if (cached) {
      setSuppliers(cached.suppliers);
      setTotalSuppliers(cached.total);
      setLoadingSuppliers(false);
      return;
    }

    try {
      const supplierResult = await partnerService.getSuppliers({
        search: debouncedSearch,
        page: supplierPage + 1,
        limit: supplierRowsPerPage
      });
      const nextSuppliers = supplierResult.suppliers ?? [];
      const nextTotal = Number(supplierResult.total ?? 0);

      setSuppliers(nextSuppliers);
      setTotalSuppliers(nextTotal);
      supplierCacheRef.current.set(key, { suppliers: nextSuppliers, total: nextTotal });
    } catch {
      setMessage({ severity: 'warning', text: 'No se pudieron cargar los proveedores.' });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, [debouncedSearch, customerPage, customerRowsPerPage]);

  useEffect(() => {
    loadSuppliers();
  }, [debouncedSearch, supplierPage, supplierRowsPerPage]);

  useEffect(() => {
    setCustomerPage(0);
    setSupplierPage(0);
  }, [debouncedSearch]);

  const resetCustomerForm = () => {
    setEditingCustomerId(null);
    setCustomerForm({
      customerType: 'PERSONA_HUMANA',
      vatCondition: 'CONSUMIDOR_FINAL',
      taxId: '',
      firstName: '',
      lastName: '',
      businessName: '',
      legalEntityType: 'OTRO',
      dni: '',
      email: '',
      phone: '',
      creditLimit: '0',
      discount: '0'
    });
  };

  const resetSupplierForm = () => {
    setEditingSupplierId(null);
    setSupplierForm({
      businessName: '',
      legalEntityType: '',
      taxId: '',
      email: '',
      phone: '',
      contact: '',
      city: ''
    });
  };

  const handleCustomerSubmit = async () => {
    if (customerForm.customerType === 'PERSONA_HUMANA') {
      if (!customerForm.firstName.trim() || !customerForm.lastName.trim() || !customerForm.dni.trim()) {
        setMessage({ severity: 'warning', text: 'Persona Humana: nombre, apellido y DNI son obligatorios.' });
        return;
      }
    }

    if (customerForm.customerType === 'EMPRESA') {
      if (!customerForm.businessName.trim() || !customerForm.taxId.trim()) {
        setMessage({ severity: 'warning', text: 'Empresa: razón social y CUIT son obligatorios.' });
        return;
      }
    }

    setSaving(true);
    setMessage(null);
    try {
      const isPerson = customerForm.customerType === 'PERSONA_HUMANA';
      const payload = {
        customerType: customerForm.customerType,
        legalEntityType: isPerson ? 'PERSONA_HUMANA' : customerForm.legalEntityType,
        vatCondition: customerForm.vatCondition,
        firstName: isPerson ? toOptionalString(customerForm.firstName) : undefined,
        lastName: isPerson ? toOptionalString(customerForm.lastName) : undefined,
        businessName: isPerson ? undefined : toOptionalString(customerForm.businessName),
        taxId: toOptionalString(customerForm.taxId),
        dni: isPerson ? toOptionalString(customerForm.dni) : undefined,
        email: toOptionalString(customerForm.email),
        phone: toOptionalString(customerForm.phone),
        creditLimit: toNumber(customerForm.creditLimit, 0),
        discount: toNumber(customerForm.discount, 0)
      };

      if (editingCustomerId) {
        await partnerService.updateCustomer(editingCustomerId, payload);
        setMessage({ severity: 'success', text: 'Cliente actualizado correctamente.' });
      } else {
        await partnerService.createCustomer(payload);
        setMessage({ severity: 'success', text: 'Cliente creado correctamente.' });
        setCustomerPage(0);
      }

      customerCacheRef.current.clear();
      resetCustomerForm();
      await loadCustomers();
    } catch {
      setMessage({ severity: 'error', text: 'No se pudo guardar el cliente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSupplierSubmit = async () => {
    if (!supplierForm.businessName.trim() || !supplierForm.taxId.trim()) {
      setMessage({ severity: 'warning', text: 'Proveedor: Razón social y CUIT son obligatorios.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        businessName: composeBusinessName(supplierForm.businessName, supplierForm.legalEntityType) ?? '',
        taxId: supplierForm.taxId.trim(),
        email: toOptionalString(supplierForm.email),
        phone: toOptionalString(supplierForm.phone),
        contact: toOptionalString(supplierForm.contact),
        city: toOptionalString(supplierForm.city)
      };

      if (editingSupplierId) {
        await partnerService.updateSupplier(editingSupplierId, payload);
        setMessage({ severity: 'success', text: 'Proveedor actualizado correctamente.' });
      } else {
        await partnerService.createSupplier(payload);
        setMessage({ severity: 'success', text: 'Proveedor creado correctamente.' });
        setSupplierPage(0);
      }

      supplierCacheRef.current.clear();
      resetSupplierForm();
      await loadSuppliers();
    } catch {
      setMessage({ severity: 'error', text: 'No se pudo guardar el proveedor.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCustomerEdit = (customer: Customer) => {
    const inferredType: CustomerType = customer.customerType ?? (customer.firstName || customer.lastName || customer.dni ? 'PERSONA_HUMANA' : 'EMPRESA');
    setEditingCustomerId(customer.id);
    setCustomerForm({
      customerType: inferredType,
      vatCondition: customer.vatCondition ?? 'CONSUMIDOR_FINAL',
      taxId: customer.taxId ?? '',
      firstName: customer.firstName ?? '',
      lastName: customer.lastName ?? '',
      businessName: customer.businessName ?? '',
      legalEntityType: inferredType === 'PERSONA_HUMANA' ? 'PERSONA_HUMANA' : (customer.legalEntityType ?? 'OTRO'),
      dni: customer.dni ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      creditLimit: String(customer.creditLimit ?? 0),
      discount: String(customer.discount ?? 0)
    });
  };

  const handleSupplierEdit = (supplier: Supplier) => {
    const parsedBusiness = splitBusinessName(supplier.businessName);
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      businessName: parsedBusiness.name,
      legalEntityType: parsedBusiness.legalEntityType,
      taxId: supplier.taxId ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      contact: supplier.contact ?? '',
      city: supplier.city ?? ''
    });
  };

  const openDeleteCustomerDialog = (customer: Customer) => {
    setDeleteCustomerDialog({
      open: true,
      id: customer.id,
      name: getCustomerDisplayName(customer)
    });
  };

  const closeDeleteCustomerDialog = () => {
    setDeleteCustomerDialog({ open: false, id: null, name: '' });
  };

  const handleDeleteCustomer = async () => {
    if (!deleteCustomerDialog.id) return;

    setSaving(true);
    setMessage(null);
    try {
      await partnerService.deleteCustomer(deleteCustomerDialog.id);
      if (editingCustomerId === deleteCustomerDialog.id) resetCustomerForm();
      setMessage({ severity: 'success', text: 'Cliente eliminado correctamente.' });
      customerCacheRef.current.clear();
      await loadCustomers();
      closeDeleteCustomerDialog();
    } catch {
      setMessage({ severity: 'error', text: 'No se pudo eliminar el cliente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('¿Seguro que querés eliminar este proveedor?')) return;
    setSaving(true);
    setMessage(null);
    try {
      await partnerService.deleteSupplier(id);
      if (editingSupplierId === id) resetSupplierForm();
      setMessage({ severity: 'success', text: 'Proveedor eliminado correctamente.' });
      supplierCacheRef.current.clear();
      await loadSuppliers();
    } catch {
      setMessage({ severity: 'error', text: 'No se pudo eliminar el proveedor.' });
    } finally {
      setSaving(false);
    }
  };

  const getCustomerDisplayName = (customer: Customer) => {
    if (customer.businessName?.trim()) return customer.businessName;
    const fullName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
    return fullName || 'Cliente sin nombre';
  };

  const handleExportSuppliers = async () => {
    const blob = await partnerService.exportSuppliersXlsx();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'proveedores.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportSuppliersPdf = async () => {
    const blob = await partnerService.exportSuppliersPdf();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'proveedores.pdf';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Clientes y Proveedores
          </Typography>
          <Typography color="text.secondary">
            Gestión de cuentas corrientes, saldo, historial, filtros y exportación.
          </Typography>
        </Box>

        {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}

        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Buscar por nombre, documento o email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Tabs value={tab} onChange={(_, next) => setTab(next)}>
              <Tab label="Clientes" />
              <Tab label="Proveedores" />
            </Tabs>
          </Stack>
        </Paper>

        {tab === 0 ? (
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6">{editingCustomerId ? 'Editar cliente' : 'Nuevo cliente'}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Tipo de cliente"
                      value={customerForm.customerType}
                      onChange={(event) => {
                        const nextType = event.target.value as CustomerType;
                        setCustomerForm((prev) => ({
                          ...prev,
                          customerType: nextType,
                          legalEntityType: nextType === 'PERSONA_HUMANA' ? 'PERSONA_HUMANA' : prev.legalEntityType === 'PERSONA_HUMANA' ? 'OTRO' : prev.legalEntityType,
                          businessName: nextType === 'PERSONA_HUMANA' ? '' : prev.businessName,
                          firstName: nextType === 'EMPRESA' ? '' : prev.firstName,
                          lastName: nextType === 'EMPRESA' ? '' : prev.lastName,
                          dni: nextType === 'EMPRESA' ? '' : prev.dni
                        }));
                      }}
                    >
                      {CUSTOMER_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Condición IVA"
                      value={customerForm.vatCondition}
                      onChange={(event) => setCustomerForm((prev) => ({ ...prev, vatCondition: event.target.value as VatCondition }))}
                    >
                      {VAT_CONDITION_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="CUIT"
                      required={customerForm.customerType === 'EMPRESA'}
                      value={customerForm.taxId}
                      onChange={(event) => setCustomerForm((prev) => ({ ...prev, taxId: event.target.value }))}
                    />
                  </Grid>

                  {customerForm.customerType === 'PERSONA_HUMANA' ? (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="Nombre"
                          value={customerForm.firstName}
                          onChange={(event) => setCustomerForm((prev) => ({ ...prev, firstName: event.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="Apellido"
                          value={customerForm.lastName}
                          onChange={(event) => setCustomerForm((prev) => ({ ...prev, lastName: event.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="DNI"
                          value={customerForm.dni}
                          onChange={(event) => setCustomerForm((prev) => ({ ...prev, dni: event.target.value }))}
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="Razón social"
                          value={customerForm.businessName}
                          onChange={(event) => setCustomerForm((prev) => ({ ...prev, businessName: event.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          select
                          fullWidth
                          label="Tipo societario"
                          value={customerForm.legalEntityType}
                          onChange={(event) => setCustomerForm((prev) => ({ ...prev, legalEntityType: event.target.value as LegalEntityType }))}
                        >
                          {LEGAL_ENTITY_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Email" value={customerForm.email} onChange={(event) => setCustomerForm((prev) => ({ ...prev, email: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Teléfono" value={customerForm.phone} onChange={(event) => setCustomerForm((prev) => ({ ...prev, phone: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Límite de crédito" type="number" value={customerForm.creditLimit} onChange={(event) => setCustomerForm((prev) => ({ ...prev, creditLimit: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Descuento (%)" type="number" value={customerForm.discount} onChange={(event) => setCustomerForm((prev) => ({ ...prev, discount: event.target.value }))} />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={handleCustomerSubmit} disabled={saving}>
                    {editingCustomerId ? 'Actualizar cliente' : 'Crear cliente'}
                  </Button>
                  {editingCustomerId ? (
                    <Button variant="outlined" onClick={resetCustomerForm} disabled={saving}>
                      Cancelar edición
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Condición IVA</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Teléfono</TableCell>
                          <TableCell align="right">Saldo</TableCell>
                          <TableCell align="right">Crédito</TableCell>
                          <TableCell align="right">Descuento</TableCell>
                          <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loadingCustomers ? (
                          <TableRow>
                            <TableCell colSpan={9}>Cargando clientes...</TableCell>
                          </TableRow>
                        ) : customers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9}>No hay clientes para mostrar.</TableCell>
                          </TableRow>
                        ) : (
                          customers.map((customer) => (
                            <TableRow key={customer.id} hover>
                              <TableCell>{getCustomerDisplayName(customer)}</TableCell>
                              <TableCell>{customer.customerType === 'EMPRESA' ? 'Empresa' : 'Persona Humana'}</TableCell>
                              <TableCell>
                                {VAT_CONDITION_OPTIONS.find((option) => option.value === customer.vatCondition)?.label ?? customer.vatCondition}
                              </TableCell>
                              <TableCell>{customer.email || '-'}</TableCell>
                              <TableCell>{customer.phone || '-'}</TableCell>
                              <TableCell align="right">${Number(customer.balance ?? 0).toFixed(2)}</TableCell>
                              <TableCell align="right">${Number(customer.creditLimit ?? 0).toFixed(2)}</TableCell>
                              <TableCell align="right">{Number(customer.discount ?? 0)}%</TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button variant="outlined" size="small" onClick={() => handleCustomerEdit(customer)}>Editar</Button>
                                  <Button color="error" variant="text" size="small" onClick={() => openDeleteCustomerDialog(customer)} disabled={saving}>Eliminar</Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCustomers}
                page={customerPage}
                onPageChange={(_, nextPage) => setCustomerPage(nextPage)}
                rowsPerPage={customerRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setCustomerRowsPerPage(Number(event.target.value));
                  setCustomerPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20, 50]}
                labelRowsPerPage="Filas por página"
              />
            </Paper>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h6">{editingSupplierId ? 'Editar proveedor' : 'Nuevo proveedor'}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth required label="Razón social" value={supplierForm.businessName} onChange={(event) => setSupplierForm((prev) => ({ ...prev, businessName: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Tipo societario (AR)"
                      value={supplierForm.legalEntityType}
                      onChange={(event) => setSupplierForm((prev) => ({ ...prev, legalEntityType: event.target.value }))}
                    >
                      <MenuItem value="">Sin especificar</MenuItem>
                      {LEGAL_ENTITY_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth required label="CUIT" value={supplierForm.taxId} onChange={(event) => setSupplierForm((prev) => ({ ...prev, taxId: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Contacto" value={supplierForm.contact} onChange={(event) => setSupplierForm((prev) => ({ ...prev, contact: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Email" value={supplierForm.email} onChange={(event) => setSupplierForm((prev) => ({ ...prev, email: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Teléfono" value={supplierForm.phone} onChange={(event) => setSupplierForm((prev) => ({ ...prev, phone: event.target.value }))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Ciudad" value={supplierForm.city} onChange={(event) => setSupplierForm((prev) => ({ ...prev, city: event.target.value }))} />
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={handleSupplierSubmit} disabled={saving}>
                    {editingSupplierId ? 'Actualizar proveedor' : 'Crear proveedor'}
                  </Button>
                  {editingSupplierId ? (
                    <Button variant="outlined" onClick={resetSupplierForm} disabled={saving}>
                      Cancelar edición
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </Paper>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Proveedores</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={handleExportSuppliers}>
                  Exportar Excel
                </Button>
                <Button variant="outlined" onClick={handleExportSuppliersPdf}>
                  Exportar PDF
                </Button>
              </Stack>
            </Box>
            <Paper sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Razón social</TableCell>
                          <TableCell>CUIT</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Teléfono</TableCell>
                          <TableCell>Ciudad</TableCell>
                          <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loadingSuppliers ? (
                          <TableRow>
                            <TableCell colSpan={6}>Cargando proveedores...</TableCell>
                          </TableRow>
                        ) : suppliers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6}>No hay proveedores para mostrar.</TableCell>
                          </TableRow>
                        ) : (
                          suppliers.map((supplier) => (
                            <TableRow key={supplier.id} hover>
                              <TableCell>{supplier.businessName}</TableCell>
                              <TableCell>{supplier.taxId}</TableCell>
                              <TableCell>{supplier.email || '-'}</TableCell>
                              <TableCell>{supplier.phone || '-'}</TableCell>
                              <TableCell>{supplier.city || '-'}</TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button variant="outlined" size="small" onClick={() => handleSupplierEdit(supplier)}>Editar</Button>
                                  <Button color="error" variant="text" size="small" onClick={() => handleDeleteSupplier(supplier.id)} disabled={saving}>Eliminar</Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalSuppliers}
                page={supplierPage}
                onPageChange={(_, nextPage) => setSupplierPage(nextPage)}
                rowsPerPage={supplierRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setSupplierRowsPerPage(Number(event.target.value));
                  setSupplierPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20, 50]}
                labelRowsPerPage="Filas por página"
              />
            </Paper>
          </Stack>
        )}
      </Stack>

      <Dialog open={deleteCustomerDialog.open} onClose={closeDeleteCustomerDialog}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Seguro que querés eliminar al cliente {deleteCustomerDialog.name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteCustomerDialog} disabled={saving}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeleteCustomer} disabled={saving}>
            Eliminar cliente
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
