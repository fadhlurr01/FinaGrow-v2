import React, { createContext, useReducer, useContext, useEffect, useCallback, useState } from 'react';
import { FMSState, Budget, Project, Transaction } from '../types';
import { transactionsApi, assetsApi, authApi, subscriptionsApi } from '../services/api';

const uid = (p = 'ID') => p + Math.random().toString(36).slice(2, 8).toUpperCase();
const today = () => new Date().toISOString().slice(0, 10);
const monthKey = (d: string) => d.slice(0, 7);

export const DEMO_COA = [
  { id: 'AC_1001', code: '1001', name: 'Kas Kecil Cabang Jakarta', description: 'Kas kecil operasional HO', type: 'Asset' as const, openingBalance: 15000000 },
  { id: 'AC_1002', code: '1002', name: 'Bank BCA Priority', description: 'Rekening bank utama perusahaan', type: 'Asset' as const, openingBalance: 1250000000 },
  { id: 'AC_1003', code: '1003', name: 'Bank Mandiri Corporate', description: 'Rekening bank giro', type: 'Asset' as const, openingBalance: 680000000 },
  { id: 'AC_1100', code: '1100', name: 'Piutang Usaha Korporat', description: 'Piutang institusi klien', type: 'Asset' as const, openingBalance: 450000000 },
  { id: 'AC_1200', code: '1200', name: 'Persediaan Finished Goods', description: 'Persediaan barang utama', type: 'Asset' as const, openingBalance: 1200000000 },
  { id: 'AC_1500', code: '1500', name: 'Aset Tetap Gedung Merdeka', description: 'Gedung pencakar langit', type: 'Asset' as const, openingBalance: 5500000000 },
  { id: 'AC_2000', code: '2000', name: 'Utang Dagang Supplier', description: 'Utang bahan baku', type: 'Liability' as const, openingBalance: 240000000 },
  { id: 'AC_2100', code: '2100', name: 'Utang PPN Masukan', description: 'PPN 11%', type: 'Liability' as const, openingBalance: 75000000 },
  { id: 'AC_3000', code: '3000', name: 'Modal Ventura Seri-A', description: 'Modal disetor investor', type: 'Equity' as const, openingBalance: 8000000000 },
  { id: 'AC_4000', code: '4000', name: 'Pendapatan Kontrak Software', description: 'Pendapatan subscription enterprise', type: 'Revenue' as const, openingBalance: 0 },
  { id: 'AC_4100', code: '4100', name: 'Pendapatan Lisensi API', description: 'Pendapatan integrasi API', type: 'Revenue' as const, openingBalance: 0 },
  { id: 'AC_5000', code: '5000', name: 'HPP Layanan Cloud', description: 'Biaya server AWS/Google Cloud', type: 'Expense' as const, openingBalance: 0 },
  { id: 'AC_5100', code: '5100', name: 'Beban Gaji Direksi & Staf', description: 'Beban kompensasi tim', type: 'Expense' as const, openingBalance: 0 },
  { id: 'AC_5200', code: '5200', name: 'Beban Sewa Data Center', description: 'Sewa fasilitas rack', type: 'Expense' as const, openingBalance: 0 },
  { id: 'AC_5300', code: '5300', name: 'Beban Marketing Campaign', description: 'Ads & PR outreach', type: 'Expense' as const, openingBalance: 0 },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'JE-0001',
    description: 'Terima Termin 1 PT. Astra International',
    date: '2026-08-30',
    type: 'income',
    category: 'Sales',
    amount: 350000000,
    status: 'Completed',
    customer: 'PT. Astra International',
    payment_method: 'Bank Transfer (BCA)',
    dr: 'AC_1002',
    cr: 'AC_1100',
    cur: 'IDR',
    entity: 'E1',
    notes: 'Penerimaan termin 1 kontrak lisensi ERP.'
  },
  {
    id: 'JE-0002',
    description: 'Bayar Cloud Server AWS',
    date: '2026-08-29',
    type: 'expense',
    category: 'Operational',
    amount: 95000000,
    status: 'Completed',
    vendor: 'AWS Cloud Services',
    payment_method: 'Bank Transfer (BCA)',
    dr: 'AC_5000',
    cr: 'AC_1002',
    cur: 'IDR',
    entity: 'E1',
    notes: 'Biaya server cluster AWS Singapore.'
  },
  {
    id: 'JE-0003',
    description: 'Distribusi Payroll Bulanan Direksi',
    date: '2026-08-28',
    type: 'expense',
    category: 'Payroll',
    amount: 185000000,
    status: 'Completed',
    vendor: 'Internal Payroll',
    payment_method: 'Bank Transfer (Mandiri)',
    dr: 'AC_5100',
    cr: 'AC_1003',
    cur: 'IDR',
    entity: 'E1',
    notes: 'Remunerasi dan gaji manajemen direksi.'
  },
  {
    id: 'JE-0004',
    description: 'SaaS Agreement - Singapore Corp',
    date: '2026-08-26',
    type: 'income',
    category: 'Sales',
    amount: 48000,
    status: 'Completed',
    customer: 'Singapore Corp',
    payment_method: 'Corporate Virtual Account',
    dr: 'AC_1002',
    cr: 'AC_4000',
    cur: 'IDR',
    entity: 'E1',
    notes: 'Subscription seat retainer bulanan.'
  },
  {
    id: 'JE-0005',
    description: 'Bayar Kampanye Digital agency',
    date: '2026-08-24',
    type: 'expense',
    category: 'Marketing',
    amount: 50000000,
    status: 'Completed',
    vendor: 'Digital Agency',
    payment_method: 'Bank Transfer (BCA)',
    dr: 'AC_5300',
    cr: 'AC_1002',
    cur: 'IDR',
    entity: 'E1',
    notes: 'Pembayaran jasa agency digital marketing.'
  }
];

export const DEMO_BUDGETS: Budget[] = [
  {
    id: 'BDG-01',
    accountId: '5100',
    period: '2026-08',
    amount: 200000000,
    entity: 'E1'
  },
  {
    id: 'BDG-02',
    accountId: '5300',
    period: '2026-08',
    amount: 75000000,
    entity: 'E1'
  }
];

export const DEMO_VENDORS: Vendor[] = [
  {
    id: 'VND-01',
    name: 'AWS Indonesia',
    contactPerson: 'Budi Santoso',
    email: 'budi@aws.id',
    phone: '0812-3456-7890',
    outstandingBalance: 0
  },
  {
    id: 'VND-02',
    name: 'Digital Marketing Agency',
    contactPerson: 'David Lee',
    email: 'david@digitalagency.com',
    phone: '0815-5566-7788',
    outstandingBalance: 50000000
  }
];

export const DEMO_INVOICES: Invoice[] = [
  // Purchases Bills (AP - Input VAT)
  {
    id: 'BILL-2026-VND01',
    invoiceNumber: 'BILL-2026-VND01',
    customer: {
      name: 'AWS Indonesia',
      email: 'budi@aws.id'
    },
    issueDate: '2026-08-31',
    dueDate: '2026-09-11',
    amount: 95000000,
    status: 'Paid',
    type: 'AP',
    party: 'AWS Indonesia',
    desc: 'Biaya server cluster AWS Singapore',
    vat: 11,
    cur: 'IDR',
    entity: 'E1'
  },
  // Sales Invoices (AR - Output VAT)
  {
    id: 'INV-2026-ENT02',
    invoiceNumber: 'INV-2026-ENT02',
    customer: {
      name: 'Kementerian Keuangan RI',
      email: 'finance@kemenkeu.go.id'
    },
    issueDate: '2026-08-28',
    dueDate: '2026-09-14',
    amount: 720000000,
    status: 'Pending',
    type: 'AR',
    party: 'Kementerian Keuangan RI',
    desc: 'Cloud Infrastructure & Accounting Modernization',
    vat: 11,
    cur: 'IDR',
    entity: 'E1'
  },
  {
    id: 'INV-2026-ENT01',
    invoiceNumber: 'INV-2026-ENT01',
    customer: {
      name: 'PT. Astra International',
      email: 'billing@astra.co.id'
    },
    issueDate: '2026-08-23',
    dueDate: '2026-09-19',
    amount: 350000000,
    status: 'Paid',
    type: 'AR',
    party: 'PT. Astra International',
    desc: 'Enterprise ERP License Implementation',
    vat: 11,
    cur: 'IDR',
    entity: 'E1'
  }
];

export const DEMO_USERS = [
  { id: 'REG_2', name: 'Demo Admin', email: 'demo_admin@fms.com', role: 'Admin', subscription: 'Pro Plan', status: 'Active', isSystem: true },
  { id: 'REG_4', name: 'Demo Account', email: 'demo@fms.com', role: 'Admin', subscription: 'Pro Plan', status: 'Active', isSystem: true },
  { id: 'REG_0', name: 'Andi Wijaya', email: 'andi@bellcorp.com', role: 'User', subscription: 'Free Plan', status: 'Active', isSystem: false },
  { id: 'REG_1', name: 'Sari Indah', email: 'sari@bellcorp.com', role: 'User', subscription: 'Free Plan', status: 'Active', isSystem: false },
  { id: 'REG_3', name: 'Demo User', email: 'demo_user@fms.com', role: 'User', subscription: 'Free Plan', status: 'Active', isSystem: false },
];

export const DEMO_ENTITIES = [
  { id: 'E1', code: 'BC', name: 'BellCorp Indonesia', currency: 'IDR' as const },
  { id: 'E2', code: 'OB', name: 'OptiBiz Global', currency: 'USD' as const },
];

export const DEMO_INVENTORY = [
  {
    id: 'INV-SKU-01',
    sku: 'SVR-DL380',
    name: 'Central Hardware Server Cluster DL380',
    category: 'HARDWARE',
    quantity: 9,
    unit: 'units',
    unitCost: 150000000,
    valuationMethod: 'FIFO',
    totalValue: 1350000000
  },
  {
    id: 'INV-SKU-02',
    sku: 'RT-CIS-93',
    name: 'Cisco Enterprise Layer 3 Router 9300',
    category: 'NETWORK',
    quantity: 15,
    unit: 'pcs',
    unitCost: 35000000,
    valuationMethod: 'AVCO',
    totalValue: 525000000
  }
];

export const DEMO_ASSETS = [
  {
    id: 'AST-EQ-100',
    code: 'AST-EQ-100',
    name: 'Server HP ProLiant Gen10',
    category: 'EQUIPMENT',
    purchaseDate: '2026-05-02',
    purchase_date: '2026-05-02',
    purchaseCost: 180000000,
    purchase_cost: 180000000,
    usefulLife: 5,
    useful_life: 5,
    accumulatedDepreciation: 12000000,
    bookValue: 168000000,
    depreciationMethod: 'STRAIGHT LINE',
    depreciation_method: 'STRAIGHT LINE'
  }
];

// Complete State for Demo Admin / Demo User
export const DEFAULT_DEMO_STATE: FMSState = {
  version: '2.0-laravel-fullstack',
  currency: 'IDR',
  lang: 'en',
  theme: 'light',
  role: 'Admin',
  subscription: 'Pro',
  activeEntity: 'E1',
  activePeriod: '2026-08',
  currentView: 'Dashboard',
  modules: {
    dashboard: true, transactions: true, invoices: true, cashbank: true,
    budgeting: true, tax: true, assets: true, inventory: true,
    coa: true, entities: true, users: true, settings: true
  },
  entities: DEMO_ENTITIES,
  users: DEMO_USERS,
  coa: DEMO_COA,
  transactions: DEMO_TRANSACTIONS,
  invoices: DEMO_INVOICES,
  budgets: DEMO_BUDGETS,
  assets: DEMO_ASSETS,
  inventory: DEMO_INVENTORY,
  projects: [],
  vendors: DEMO_VENDORS,
  payrollRuns: [],
  notifications: [
    {
      id: 'N1',
      title: 'Sistem FINAGROW Live Demo Active',
      message: 'Database MySQL & RESTful API aktif. Seluruh data tersinkronisasi secara real-time.',
      date: '2026-08-30',
      isRead: false,
      type: 'info'
    }
  ],
};

// Retail UKM State for Demo User (Screenshot_1967)
export const DEMO_USER_COA = [
  { id: 'AC_1001', code: '1001', name: 'Cash Register Laci Utama', description: 'Uang tunai cash register', type: 'Asset' as const, openingBalance: 2500000 },
  { id: 'AC_1002', code: '1002', name: 'Bank Jatim UKM', description: 'Rekening operasional bank lokal', type: 'Asset' as const, openingBalance: 45000000 },
  { id: 'AC_1100', code: '1100', name: 'Piutang Langganan Warung', description: 'Piutang retail kecil', type: 'Asset' as const, openingBalance: 7500000 },
  { id: 'AC_1200', code: '1200', name: 'Persediaan Sembako & Barang', description: 'Stok dagangan toko', type: 'Asset' as const, openingBalance: 50000000 },
  { id: 'AC_2000', code: '2000', name: 'Utang Agen Supplier Sembako', description: 'Utang ke grosiran', type: 'Liability' as const, openingBalance: 12000000 },
  { id: 'AC_3000', code: '3000', name: 'Modal Muklas Pribadi', description: 'Modal awal pendiri toko', type: 'Equity' as const, openingBalance: 93000000 },
  { id: 'AC_4000', code: '4000', name: 'Pendapatan Retail Harian', description: 'Penjualan retail langsung sembako', type: 'Revenue' as const, openingBalance: 0 },
  { id: 'AC_5100', code: '5100', name: 'Beban Gaji Karyawan Toko', description: 'Gaji penjaga kasir', type: 'Expense' as const, openingBalance: 0 },
  { id: 'AC_5200', code: '5200', name: 'Beban Listrik & Air Ruko', description: 'Biaya utilitas toko bulanan', type: 'Expense' as const, openingBalance: 0 },
];

export const DEMO_USER_TRANSACTIONS: Transaction[] = [
  {
    id: 'JE-0001',
    description: 'Penjualan Retail Kasir Sesi Pagi',
    date: '2026-09-01',
    type: 'income',
    category: 'Sales',
    amount: 3500000,
    status: 'Completed',
    customer: 'Pelanggan Retail',
    payment_method: 'Cash',
    dr: 'AC_1001',
    cr: 'AC_4000',
    cur: 'IDR',
    entity: 'E1',
    notes: 'Penerimaan tunai kasir pagi.'
  },
  {
    id: 'JE-0002',
    description: 'Belanja Stok Sembako Pasar Anyar',
    date: '2026-08-31',
    type: 'expense',
    category: 'Operational',
    amount: 1800000,
    status: 'Completed',
    vendor: 'Pasar Anyar Grosir',
    payment_method: 'Cash',
    dr: 'AC_1200',
    cr: 'AC_1001',
    cur: 'IDR',
    entity: 'E1',
    notes: 'Pembelian stok sembako eceran.'
  },
  {
    id: 'JE-0003',
    description: 'Gaji Bulanan 2 Kasir Toko',
    date: '2026-08-30',
    type: 'expense',
    category: 'Payroll',
    amount: 5000000,
    status: 'Completed',
    vendor: 'Kasir Toko',
    payment_method: 'Bank Transfer (Jatim)',
    dr: 'AC_5100',
    cr: 'AC_1002',
    cur: 'IDR',
    entity: 'E1',
    notes: 'Gaji bulanan penjaga kasir.'
  }
];

export const DEMO_USER_BUDGETS: Budget[] = [
  {
    id: 'BDG-USR-01',
    accountId: '5200',
    period: '2026-09',
    amount: 2000000,
    entity: 'E1'
  }
];

export const DEMO_USER_VENDORS: Vendor[] = [
  {
    id: 'VND-USR-01',
    name: 'CV. Mandiri Sembako',
    contactPerson: 'Haji Mukhtar',
    email: 'grosir.mukhtar@gmail.com',
    phone: '0812-7000-8300',
    outstandingBalance: 12000000
  }
];

export const DEMO_USER_INVOICES: Invoice[] = [
  {
    id: 'INV-RT-2026-001',
    invoiceNumber: 'INV-RT-2026-001',
    customer: {
      name: 'Katering Ibu Rahma',
      email: 'rahma@gmail.com'
    },
    issueDate: '2026-08-28',
    dueDate: '2026-09-02',
    amount: 7500000,
    status: 'Pending',
    type: 'AR',
    party: 'Katering Ibu Rahma',
    desc: 'Pesanan partai beras & minyak sembako',
    vat: 11,
    cur: 'IDR',
    entity: 'E1'
  }
];

export const DEMO_USER_ENTITIES = [
  { id: 'E1', code: 'RT', name: 'Retail Sentosa Abadi', currency: 'IDR' as const }
];

export const DEMO_USER_ASSETS = [
  {
    id: 'AST-EQP-001',
    code: 'AST-EQP-001',
    name: 'MacBook Pro M3 Max 16" (Desain)',
    category: 'EQUIPMENT',
    purchaseDate: '2024-01-15',
    purchase_date: '2024-01-15',
    purchaseCost: 45000000,
    purchase_cost: 45000000,
    usefulLife: 4,
    useful_life: 4,
    accumulatedDepreciation: 30000000,
    bookValue: 15000000,
    depreciationMethod: 'STRAIGHT LINE',
    depreciation_method: 'STRAIGHT LINE'
  },
  {
    id: 'AST-BLD-001',
    code: 'AST-BLD-001',
    name: 'Ruko Sentra Kemang (Kantor)',
    category: 'BUILDING',
    purchaseDate: '2021-03-01',
    purchase_date: '2021-03-01',
    purchaseCost: 1500000000,
    purchase_cost: 1500000000,
    usefulLife: 20,
    useful_life: 20,
    accumulatedDepreciation: 412500000,
    bookValue: 1087500000,
    depreciationMethod: 'STRAIGHT LINE',
    depreciation_method: 'STRAIGHT LINE'
  },
  {
    id: 'AST-VEH-001',
    code: 'AST-VEH-001',
    name: 'Toyota Avanza Operational',
    category: 'VEHICLE',
    purchaseDate: '2022-06-10',
    purchase_date: '2022-06-10',
    purchaseCost: 260000000,
    purchase_cost: 260000000,
    usefulLife: 8,
    useful_life: 8,
    accumulatedDepreciation: 138125000,
    bookValue: 121875000,
    depreciationMethod: 'STRAIGHT LINE',
    depreciation_method: 'STRAIGHT LINE'
  }
];

export const DEFAULT_DEMO_USER_STATE: FMSState = {
  version: '2.0-laravel-fullstack',
  currency: 'IDR',
  lang: 'en',
  theme: 'light',
  role: 'User',
  subscription: 'Free',
  activeEntity: 'E1',
  activePeriod: '2026-09',
  currentView: 'Dashboard',
  modules: {
    dashboard: true, transactions: true, invoices: true, cashbank: true,
    budgeting: true, tax: true, assets: true, inventory: true,
    coa: true, entities: true, users: true, settings: true
  },
  entities: DEMO_USER_ENTITIES,
  users: [
    { id: 'REG_3', name: 'Demo User', email: 'demo_user@fms.com', role: 'User', subscription: 'Free Plan', status: 'Active' }
  ],
  coa: DEMO_USER_COA,
  transactions: DEMO_USER_TRANSACTIONS,
  invoices: DEMO_USER_INVOICES,
  budgets: DEMO_USER_BUDGETS,
  assets: DEMO_USER_ASSETS,
  inventory: [],
  projects: [],
  vendors: DEMO_USER_VENDORS,
  payrollRuns: [],
  notifications: [
    {
      id: 'N_USER_DEMO',
      title: 'Selamat Datang di Demo Retail UKM Toko Sembako',
      message: 'Anda sedang menggunakan mode demo akun toko sembako retail.',
      date: '2026-09-01',
      isRead: false,
      type: 'info'
    }
  ],
};

// Clean State for Fresh New Registered Users (0 Transactions, 0 Balance)
export const DEFAULT_CLEAN_STATE: FMSState = {
  version: '2.0-laravel-fullstack',
  currency: 'IDR',
  lang: 'id',
  theme: 'light',
  role: 'User',
  subscription: 'Free',
  activeEntity: 'E1',
  activePeriod: monthKey(today()),
  currentView: 'Dashboard',
  modules: {
    dashboard: true, transactions: true, invoices: true, cashbank: true,
    budgeting: true, tax: true, assets: true, inventory: true,
    coa: true, entities: true, users: true, settings: true
  },
  entities: [
    { id: 'E1', code: 'HQ', name: 'Entitas Utama', currency: 'IDR' }
  ],
  users: [],
  coa: DEMO_COA.map(acc => ({ ...acc, openingBalance: 0 })),
  transactions: [],
  invoices: [],
  budgets: [],
  assets: [],
  inventory: [],
  projects: [],
  vendors: [],
  payrollRuns: [],
  notifications: [
    {
      id: 'N_WELCOME',
      title: 'Selamat Datang di FINAGROW',
      message: 'Akun baru Anda siap digunakan. Silakan mulai dengan mencatat transaksi pertama Anda.',
      date: today(),
      isRead: false,
      type: 'info'
    }
  ],
};

export const DEFAULT_STATE: FMSState = DEFAULT_DEMO_STATE;

type Action =
  | { type: 'SET_STATE'; payload: FMSState }
  | { type: 'TOGGLE_MODULE'; payload: { key: string; value: boolean } }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: any }
  | { type: 'EDIT_TRANSACTION'; payload: any }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_ASSETS'; payload: any[] }
  | { type: 'ADD_ASSET'; payload: any }
  | { type: 'EDIT_ASSET'; payload: any }
  | { type: 'DELETE_ASSET'; payload: string }
  | { type: 'ADD_COA_ACCOUNT'; payload: any }
  | { type: 'EDIT_COA_ACCOUNT'; payload: any }
  | { type: 'DELETE_COA_ACCOUNT'; payload: string }
  | { type: 'ADD_INVOICE'; payload: any }
  | { type: 'EDIT_INVOICE'; payload: any }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'ADD_VENDOR'; payload: any }
  | { type: 'EDIT_VENDOR'; payload: any }
  | { type: 'DELETE_VENDOR'; payload: string }
  | { type: 'ADD_ENTITY'; payload: any }
  | { type: 'EDIT_ENTITY'; payload: any }
  | { type: 'DELETE_ENTITY'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Omit<Budget, 'id'> }
  | { type: 'EDIT_BUDGET'; payload: any }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_INVENTORY_ITEM'; payload: any }
  | { type: 'EDIT_INVENTORY_ITEM'; payload: any }
  | { type: 'DELETE_INVENTORY_ITEM'; payload: string }
  | { type: 'ADD_USER'; payload: any }
  | { type: 'EDIT_USER'; payload: any }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id'> }
  | { type: 'LOGIN_USER'; payload: { email: string; stateData: FMSState; token?: string } }
  | { type: 'LOGOUT_USER' }
  | { type: 'SET_SUBSCRIPTION'; payload: 'Free' | 'Pro' }
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: any }
  | { type: 'DELETE_NOTIFICATION'; payload: string };

const fmsReducer = (state: FMSState, action: Action): FMSState => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...action.payload };

    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload
      };

    case 'SET_ASSETS':
      return {
        ...state,
        assets: action.payload
      };

    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        subscription: action.payload,
      };

    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload,
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: (state.notifications || []).map(notif =>
          action.payload === 'all' || notif.id === action.payload
            ? { ...notif, isRead: true }
            : notif
        )
      };

    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: (state.notifications || []).filter(notif => notif.id !== action.payload)
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...(state.notifications || [])]
      };

    case 'ADD_TRANSACTION': {
      const newTx = { ...action.payload, id: action.payload.id || uid('TX') };
      const newNotif = {
        id: uid('N'),
        title: state.lang === 'id' ? 'Transaksi Dicatat' : 'Transaction Recorded',
        message: state.lang === 'id'
          ? `Transaksi "${newTx.description || 'Tanpa Nama'}" senilai IDR ${Number(newTx.amount).toLocaleString()} berhasil disimpan ke Database.`
          : `Transaction "${newTx.description || 'Unnamed'}" of IDR ${Number(newTx.amount).toLocaleString()} was saved.`,
        date: today(),
        isRead: false,
        type: 'success' as const
      };
      return {
        ...state,
        transactions: [newTx, ...state.transactions.filter(t => t.id !== newTx.id)],
        notifications: [newNotif, ...(state.notifications || [])]
      };
    }

    case 'EDIT_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(tx => tx.id === action.payload.id ? action.payload : tx)
      };

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(tx => tx.id !== action.payload)
      };

    case 'ADD_ASSET': {
      const newAsset = { ...action.payload, id: action.payload.id || uid('AST') };
      return {
        ...state,
        assets: [newAsset, ...state.assets.filter(a => a.id !== newAsset.id)]
      };
    }

    case 'EDIT_ASSET':
      return {
        ...state,
        assets: state.assets.map(a => a.id === action.payload.id ? action.payload : a)
      };

    case 'DELETE_ASSET':
      return {
        ...state,
        assets: state.assets.filter(a => a.id !== action.payload)
      };

    case 'ADD_INVOICE': {
      const newInv = { ...action.payload, id: uid('INV') };
      return {
        ...state,
        invoices: [newInv, ...state.invoices]
      };
    }

    case 'EDIT_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(inv => inv.id === action.payload.id ? action.payload : inv)
      };

    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(inv => inv.id !== action.payload)
      };

    case 'ADD_COA_ACCOUNT':
      return {
        ...state,
        coa: [...state.coa, { ...action.payload, id: uid('AC') }]
      };

    case 'EDIT_COA_ACCOUNT':
      return {
        ...state,
        coa: state.coa.map(acc => acc.id === action.payload.id ? action.payload : acc)
      };

    case 'DELETE_COA_ACCOUNT':
      return {
        ...state,
        coa: state.coa.filter(acc => acc.id !== action.payload)
      };

    case 'ADD_VENDOR':
      return {
        ...state,
        vendors: [{ ...action.payload, id: uid('VEND') }, ...state.vendors]
      };

    case 'EDIT_VENDOR':
      return {
        ...state,
        vendors: state.vendors.map(v => v.id === action.payload.id ? action.payload : v)
      };

    case 'DELETE_VENDOR':
      return {
        ...state,
        vendors: state.vendors.filter(v => v.id !== action.payload)
      };

    case 'ADD_ENTITY':
      return {
        ...state,
        entities: [...state.entities, { ...action.payload, id: uid('E') }]
      };

    case 'EDIT_ENTITY':
      return {
        ...state,
        entities: state.entities.map(e => e.id === action.payload.id ? action.payload : e)
      };

    case 'DELETE_ENTITY':
      return {
        ...state,
        entities: state.entities.filter(e => e.id !== action.payload)
      };

    case 'ADD_BUDGET':
      return {
        ...state,
        budgets: [...state.budgets, { ...action.payload, id: uid('BD') }]
      };

    case 'EDIT_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b => b.id === action.payload.id ? action.payload : b)
      };

    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload)
      };

    case 'ADD_INVENTORY_ITEM':
      return {
        ...state,
        inventory: [...state.inventory, { ...action.payload, id: uid('IV') }]
      };

    case 'EDIT_INVENTORY_ITEM':
      return {
        ...state,
        inventory: state.inventory.map(i => i.id === action.payload.id ? action.payload : i)
      };

    case 'DELETE_INVENTORY_ITEM':
      return {
        ...state,
        inventory: state.inventory.filter(i => i.id !== action.payload)
      };

    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, { ...action.payload, id: uid('U') }]
      };

    case 'EDIT_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? action.payload : u)
      };

    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload)
      };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, { ...action.payload, id: uid('PROJ') }]
      };

    case 'LOGIN_USER': {
      return {
        ...action.payload.stateData,
        currentUserEmail: action.payload.email
      };
    }

    case 'LOGOUT_USER':
      return {
        ...DEFAULT_STATE,
        currentUserEmail: undefined
      };

    default:
      return state;
  }
};

interface FMSContextType {
  state: FMSState;
  dispatch: React.Dispatch<Action>;
  isLoading: boolean;
  refreshFromApi: () => Promise<void>;
  createTransactionApi: (tx: Partial<Transaction>) => Promise<any>;
  updateTransactionApi: (id: string, tx: Partial<Transaction>) => Promise<any>;
  deleteTransactionApi: (id: string) => Promise<any>;
  createAssetApi: (asset: any) => Promise<any>;
  updateAssetApi: (id: string, asset: any) => Promise<any>;
  deleteAssetApi: (id: string) => Promise<any>;
  upgradeToProApi: (plan?: 'Pro' | 'Enterprise') => Promise<any>;
}

const FMSContext = createContext<FMSContextType>({
  state: DEFAULT_STATE,
  dispatch: () => null,
  isLoading: false,
  refreshFromApi: async () => {},
  createTransactionApi: async () => {},
  updateTransactionApi: async () => {},
  deleteTransactionApi: async () => {},
  createAssetApi: async () => {},
  updateAssetApi: async () => {},
  deleteAssetApi: async () => {},
  upgradeToProApi: async () => {},
});

export const FMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [state, dispatch] = useReducer(fmsReducer, DEFAULT_STATE, (initial) => {
    try {
      const activeEmail = localStorage.getItem('fms_active_user_email');
      if (activeEmail) {
        const userData = localStorage.getItem(`fms_state_user_${activeEmail}`);
        if (userData) {
          return { ...JSON.parse(userData), currentUserEmail: activeEmail };
        }
      }
      return initial;
    } catch (e) {
      console.error('Error restoring localStorage session', e);
      return initial;
    }
  });

  // Dynamic API sync loader
  const refreshFromApi = useCallback(async () => {
    const token = localStorage.getItem('fms_auth_token');
    if (!token) return;

    setIsLoading(true);
    try {
      // 1. Fetch Profile & Subscription Status
      const profileRes = await authApi.getProfile();
      if (profileRes && profileRes.user) {
        const u = profileRes.user;
        dispatch({
          type: 'SET_SUBSCRIPTION',
          payload: u.is_pro || u.subscription === 'Pro' ? 'Pro' : 'Free'
        });
      }

      // 2. Fetch Transactions from Laravel MySQL
      const txRes = await transactionsApi.getAll();
      if (txRes && txRes.success && Array.isArray(txRes.data)) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: txRes.data });
      }

      // 3. Fetch Assets from Laravel MySQL
      const assetRes = await assetsApi.getAll();
      if (assetRes && assetRes.success && Array.isArray(assetRes.data)) {
        dispatch({ type: 'SET_ASSETS', payload: assetRes.data });
      }
    } catch (err) {
      console.warn('API Sync notice (Local mock fallback active):', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch from API whenever user is logged in
  useEffect(() => {
    if (state.currentUserEmail) {
      refreshFromApi();
    }
  }, [state.currentUserEmail, refreshFromApi]);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      if (state.currentUserEmail) {
        localStorage.setItem(`fms_state_user_${state.currentUserEmail}`, JSON.stringify(state));
        localStorage.setItem('fms_active_user_email', state.currentUserEmail);
      }
    } catch (e) {
      console.error('Could not save to localStorage', e);
    }
  }, [state]);

  // Async API Helper: Create Transaction
  const createTransactionApi = async (tx: Partial<Transaction>) => {
    try {
      const res = await transactionsApi.create(tx);
      if (res && res.data) {
        dispatch({ type: 'ADD_TRANSACTION', payload: res.data });
        return res.data;
      }
    } catch (e) {
      console.warn('API creation failed, adding locally:', e);
    }
    // Optimistic fallback
    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
    return tx;
  };

  // Async API Helper: Update Transaction
  const updateTransactionApi = async (id: string, tx: Partial<Transaction>) => {
    try {
      await transactionsApi.update(id, tx);
    } catch (e) {
      console.warn('API update fallback:', e);
    }
    dispatch({ type: 'EDIT_TRANSACTION', payload: { ...tx, id } });
  };

  // Async API Helper: Delete Transaction
  const deleteTransactionApi = async (id: string) => {
    try {
      await transactionsApi.delete(id);
    } catch (e) {
      console.warn('API deletion fallback:', e);
    }
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  };

  // Async API Helper: Create Asset
  const createAssetApi = async (asset: any) => {
    try {
      const res = await assetsApi.create(asset);
      if (res && res.data) {
        dispatch({ type: 'ADD_ASSET', payload: res.data });
        return res.data;
      }
    } catch (e) {
      console.warn('API asset create fallback:', e);
    }
    dispatch({ type: 'ADD_ASSET', payload: asset });
  };

  // Async API Helper: Update Asset
  const updateAssetApi = async (id: string, asset: any) => {
    try {
      await assetsApi.update(id, asset);
    } catch (e) {
      console.warn('API asset update fallback:', e);
    }
    dispatch({ type: 'EDIT_ASSET', payload: { ...asset, id } });
  };

  // Async API Helper: Delete Asset
  const deleteAssetApi = async (id: string) => {
    try {
      await assetsApi.delete(id);
    } catch (e) {
      console.warn('API asset delete fallback:', e);
    }
    dispatch({ type: 'DELETE_ASSET', payload: id });
  };

  // Async API Helper: Upgrade to Pro
  const upgradeToProApi = async (plan: 'Pro' | 'Enterprise' = 'Pro') => {
    try {
      const res = await subscriptionsApi.upgrade(plan);
      if (res && res.success) {
        dispatch({ type: 'SET_SUBSCRIPTION', payload: 'Pro' });
        return res;
      }
    } catch (e) {
      console.warn('API upgrade fallback:', e);
    }
    dispatch({ type: 'SET_SUBSCRIPTION', payload: 'Pro' });
  };

  return (
    <FMSContext.Provider value={{
      state,
      dispatch,
      isLoading,
      refreshFromApi,
      createTransactionApi,
      updateTransactionApi,
      deleteTransactionApi,
      createAssetApi,
      updateAssetApi,
      deleteAssetApi,
      upgradeToProApi
    }}>
      {children}
    </FMSContext.Provider>
  );
};

export const useFMS = () => useContext(FMSContext);