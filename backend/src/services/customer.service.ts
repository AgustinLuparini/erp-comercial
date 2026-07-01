import { prisma } from '../prisma/client.js';
import { AppError } from '../utils/apiResponse.js';
import type {
  CustomerAccountEntryCreateDTO,
  CustomerCreateDTO,
  CustomerFilterDTO,
  CustomerType,
  CustomerUpdateDTO,
  LegalEntityType,
  VatCondition
} from '../dtos/customer.dto.js';

const mapCustomer = (customer: any) => ({
  ...customer,
  creditLimit: Number(customer.creditLimit),
  balance: Number(customer.balance),
  discount: Number(customer.discount)
});

const CUSTOMER_TYPES: CustomerType[] = ['PERSONA_HUMANA', 'EMPRESA'];
const LEGAL_ENTITY_TYPES: LegalEntityType[] = [
  'PERSONA_HUMANA',
  'SAS',
  'SRL',
  'SA',
  'SAU',
  'COOPERATIVA',
  'ASOCIACION_CIVIL',
  'FUNDACION',
  'OTRO'
];
const VAT_CONDITIONS: VatCondition[] = [
  'CONSUMIDOR_FINAL',
  'MONOTRIBUTISTA',
  'RESPONSABLE_INSCRIPTO',
  'EXENTO',
  'NO_RESPONSABLE',
  'MONOTRIBUTO_SOCIAL'
];

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toOptionalCustomerType = (value: unknown): CustomerType | undefined => {
  if (typeof value !== 'string') return undefined;
  return CUSTOMER_TYPES.includes(value as CustomerType) ? (value as CustomerType) : undefined;
};

const toOptionalLegalEntityType = (value: unknown): LegalEntityType | undefined => {
  if (typeof value !== 'string') return undefined;
  return LEGAL_ENTITY_TYPES.includes(value as LegalEntityType) ? (value as LegalEntityType) : undefined;
};

const toOptionalVatCondition = (value: unknown): VatCondition | undefined => {
  if (typeof value !== 'string') return undefined;
  return VAT_CONDITIONS.includes(value as VatCondition) ? (value as VatCondition) : undefined;
};

const normalizeCustomerPayload = (data: CustomerCreateDTO) => {
  const firstName = toOptionalString(data.firstName);
  const lastName = toOptionalString(data.lastName);
  const businessName = toOptionalString(data.businessName);
  const taxId = toOptionalString(data.taxId);
  const dni = toOptionalString(data.dni);
  const email = toOptionalString(data.email);
  const phone = toOptionalString(data.phone);
  const address = toOptionalString(data.address);
  const city = toOptionalString(data.city);
  const province = toOptionalString(data.province);

  const inferredType: CustomerType = firstName || lastName || dni ? 'PERSONA_HUMANA' : 'EMPRESA';
  const parsedCustomerType = toOptionalCustomerType(data.customerType);
  if (data.customerType !== undefined && !parsedCustomerType) {
    throw new AppError('Tipo de cliente inválido', 400);
  }
  const customerType = parsedCustomerType ?? inferredType;
  const legalEntityType = toOptionalLegalEntityType(data.legalEntityType);
  const vatCondition = toOptionalVatCondition(data.vatCondition);

  if (data.legalEntityType !== undefined && !legalEntityType) {
    throw new AppError('Tipo societario inválido', 400);
  }

  if (!vatCondition) {
    throw new AppError('La condición frente al IVA es obligatoria', 400);
  }

  if (customerType === 'PERSONA_HUMANA') {
    if (!firstName) throw new AppError('Nombre obligatorio para Persona Humana', 400);
    if (!lastName) throw new AppError('Apellido obligatorio para Persona Humana', 400);
    if (!dni) throw new AppError('DNI obligatorio para Persona Humana', 400);

    return {
      customerType,
      legalEntityType: 'PERSONA_HUMANA' as LegalEntityType,
      vatCondition,
      firstName,
      lastName,
      businessName: `${firstName} ${lastName}`.trim(),
      taxId,
      dni,
      email,
      phone,
      address,
      city,
      province,
      creditLimit: data.creditLimit ?? 0,
      discount: data.discount ?? 0,
      balance: data.balance ?? 0,
      isActive: data.isActive
    };
  }

  if (!businessName) throw new AppError('Razón social obligatoria para Empresa', 400);
  if (!taxId) throw new AppError('CUIT obligatorio para Empresa', 400);
  if (!legalEntityType || legalEntityType === 'PERSONA_HUMANA') {
    throw new AppError('Tipo societario obligatorio para Empresa', 400);
  }

  return {
    customerType,
    legalEntityType,
    vatCondition,
    firstName: null,
    lastName: null,
    businessName,
    taxId,
    dni: null,
    email,
    phone,
    address,
    city,
    province,
    creditLimit: data.creditLimit ?? 0,
    discount: data.discount ?? 0,
    balance: data.balance ?? 0,
    isActive: data.isActive
  };
};

export class CustomerService {
  async create(data: CustomerCreateDTO) {
    const normalized = normalizeCustomerPayload(data);
    const customer = await prisma.customer.create({
      data: normalized
    });

    return mapCustomer(customer);
  }

  async list(filter: CustomerFilterDTO) {
    const page = toPositiveInt(filter.page, 1);
    const limit = toPositiveInt(filter.limit, 20);
    const where: any = { deletedAt: null };
    const isActive = toOptionalBoolean(filter.isActive);
    const customerType = toOptionalCustomerType(filter.customerType);
    const minBalance = toOptionalNumber(filter.minBalance);
    const maxBalance = toOptionalNumber(filter.maxBalance);

    if (isActive !== undefined) where.isActive = isActive;
    if (customerType) where.customerType = customerType;
    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { businessName: { contains: filter.search, mode: 'insensitive' } },
        { taxId: { contains: filter.search, mode: 'insensitive' } },
        { dni: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } }
      ];
    }
    if (minBalance !== undefined || maxBalance !== undefined) {
      where.balance = {};
      if (minBalance !== undefined) where.balance.gte = minBalance;
      if (maxBalance !== undefined) where.balance.lte = maxBalance;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return {
      total,
      page,
      limit,
      customers: customers.map(mapCustomer)
    };
  }

  async getById(id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        sales: { orderBy: { createdAt: 'desc' }, take: 20 },
        accountEntries: { orderBy: { createdAt: 'desc' }, take: 50 }
      }
    });

    if (!customer) throw new AppError('Cliente no encontrado', 404);
    return mapCustomer(customer);
  }

  async update(data: CustomerUpdateDTO) {
    const { id, ...payload } = data;

    const current = await prisma.customer.findFirst({
      where: { id, deletedAt: null }
    });

    if (!current) throw new AppError('Cliente no encontrado', 404);

    const merged: CustomerCreateDTO = {
      customerType: (payload.customerType ?? current.customerType) as CustomerType,
      legalEntityType: (payload.legalEntityType ?? current.legalEntityType) as LegalEntityType,
      vatCondition: (payload.vatCondition ?? current.vatCondition) as VatCondition,
      firstName: payload.firstName ?? current.firstName ?? undefined,
      lastName: payload.lastName ?? current.lastName ?? undefined,
      businessName: payload.businessName ?? current.businessName ?? undefined,
      taxId: payload.taxId ?? current.taxId ?? undefined,
      dni: payload.dni ?? current.dni ?? undefined,
      email: payload.email ?? current.email ?? undefined,
      phone: payload.phone ?? current.phone ?? undefined,
      address: payload.address ?? current.address ?? undefined,
      city: payload.city ?? current.city ?? undefined,
      province: payload.province ?? current.province ?? undefined,
      creditLimit: payload.creditLimit ?? Number(current.creditLimit),
      discount: payload.discount ?? current.discount,
      balance: payload.balance ?? Number(current.balance),
      isActive: payload.isActive ?? current.isActive
    };

    const normalized = normalizeCustomerPayload(merged);

    const customer = await prisma.customer.update({
      where: { id },
      data: normalized
    });
    return mapCustomer(customer);
  }

  async remove(id: string) {
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });
    return { success: true };
  }

  async getBalance(id: string) {
    const customer = await prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) throw new AppError('Cliente no encontrado', 404);
    return { id: customer.id, balance: Number(customer.balance), creditLimit: Number(customer.creditLimit), discount: customer.discount };
  }

  async getHistory(id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          include: { details: true }
        },
        accountEntries: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!customer) throw new AppError('Cliente no encontrado', 404);

    return {
      sales: customer.sales.map((sale: any) => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber,
        saleType: sale.saleType,
        status: sale.status,
        total: Number(sale.total),
        createdAt: sale.createdAt,
        details: sale.details
      })),
      accountEntries: customer.accountEntries.map((entry: any) => ({
        id: entry.id,
        entryType: entry.entryType,
        amount: Number(entry.amount),
        balanceAfter: Number(entry.balanceAfter),
        description: entry.description,
        createdAt: entry.createdAt
      }))
    };
  }

  async createAccountEntry(data: CustomerAccountEntryCreateDTO) {
    const customer = await prisma.customer.findFirst({ where: { id: data.customerId, deletedAt: null } });
    if (!customer) throw new AppError('Cliente no encontrado', 404);

    const currentBalance = Number(customer.balance);
    const signedAmount = data.entryType === 'PAYMENT' ? -data.amount : data.amount;
    const nextBalance = currentBalance + signedAmount;

    const entry = await prisma.customerAccountEntry.create({
      data: {
        customerId: data.customerId,
        userId: data.userId,
        entryType: data.entryType,
        amount: data.amount,
        balanceAfter: nextBalance,
        description: data.description
      }
    });

    await prisma.customer.update({ where: { id: data.customerId }, data: { balance: nextBalance } });

    return { ...entry, amount: Number(entry.amount), balanceAfter: Number(entry.balanceAfter) };
  }
}

export default new CustomerService();