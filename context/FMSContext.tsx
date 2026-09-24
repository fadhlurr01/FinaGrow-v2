import React, { createContext, useReducer, useContext, useEffect, useCallback, useState } from 'react';
import { FMSState, Budget, Project, Transaction, COAAccount } from '../types';
import { transactionsApi, assetsApi, coaApi, authApi, subscriptionsApi, usersApi } from '../services/api';

const uid = (p = 'ID') => p + Math.random().toString(36).slice(2, 8).toUpperCase();
const today = () => new Date().toISOString().slice(0, 10);
const monthKey = (d: string) => d.slice(0, 7);

export const DEMO_COA: COAAccount[] = [];

export const DEMO_TRANSACTIONS: Transaction[] = [];
export const DEMO_BUDGETS: Budget[] = [];
export const DEMO_VENDORS: any[] = [];
export const DEMO_INVOICES: any[] = [];
export const DEMO_USERS: any[] = [];
export const DEMO_ASSETS: any[] = [];

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
  coa: [],
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

export const DEFAULT_STATE: FMSState = DEFAULT_CLEAN_STATE;
export const DEFAULT_DEMO_STATE: FMSState = DEFAULT_CLEAN_STATE;
export const DEFAULT_DEMO_USER_STATE: FMSState = DEFAULT_CLEAN_STATE;

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
  | { type: 'SET_COA'; payload: COAAccount[] }
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
  | { type: 'SET_USERS'; payload: any[] }
  | { type: 'SET_ACTIVE_USER'; payload: any }
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

    case 'SET_COA':
      return {
        ...state,
        coa: action.payload
      };

    case 'ADD_COA_ACCOUNT': {
      const newAcc = { ...action.payload, id: action.payload.id || uid('AC') };
      return {
        ...state,
        coa: [...state.coa.filter(a => a.id !== newAcc.id), newAcc]
      };
    }

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

    case 'SET_USERS':
      return {
        ...state,
        users: action.payload
      };

    case 'SET_ACTIVE_USER': {
      const user = action.payload;
      return {
        ...state,
        activeUser: user,
        currentUserEmail: user.email || state.currentUserEmail,
        role: user.role ? (user.role === 'admin' ? 'Admin' : (user.role === 'demo' ? 'Admin' : 'User')) : state.role,
        subscription: (user.is_pro || user.subscription === 'Pro') ? 'Pro' : (state.subscription || 'Free')
      };
    }

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
        ...DEFAULT_CLEAN_STATE,
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
  createCoaApi: (account: Partial<COAAccount>) => Promise<any>;
  updateCoaApi: (id: string, account: Partial<COAAccount>) => Promise<any>;
  deleteCoaApi: (id: string) => Promise<any>;
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
  createCoaApi: async () => {},
  updateCoaApi: async () => {},
  deleteCoaApi: async () => {},
  upgradeToProApi: async () => {},
});

export const FMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [state, dispatch] = useReducer(fmsReducer, DEFAULT_CLEAN_STATE, (initial) => {
    try {
      const activeEmail = localStorage.getItem('fms_active_user_email');
      if (activeEmail) {
        return { ...initial, currentUserEmail: activeEmail };
      }
      return initial;
    } catch (e) {
      return initial;
    }
  });

  // Dynamic API sync loader from Laravel MySQL Backend
  const refreshFromApi = useCallback(async () => {
    const token = localStorage.getItem('fms_auth_token');
    if (!token) return;

    setIsLoading(true);
    try {
      // 1. Fetch Profile & Subscription Status from MySQL
      const profileRes = await authApi.getProfile();
      if (profileRes && profileRes.user) {
        dispatch({
          type: 'SET_ACTIVE_USER',
          payload: profileRes.user
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

      // 4. Fetch Chart of Accounts from Laravel MySQL
      const coaRes = await coaApi.getAll();
      if (coaRes && coaRes.success && Array.isArray(coaRes.data)) {
        dispatch({ type: 'SET_COA', payload: coaRes.data });
      }

      // 5. Fetch Team / Users from Laravel MySQL
      const usersRes = await usersApi.getAll();
      if (usersRes && usersRes.success && Array.isArray(usersRes.data)) {
        dispatch({ type: 'SET_USERS', payload: usersRes.data });
      }
    } catch (err) {
      console.warn('Backend API Sync notice:', err);
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

  // Keep active session user email updated
  useEffect(() => {
    try {
      if (state.currentUserEmail) {
        localStorage.setItem('fms_active_user_email', state.currentUserEmail);
      }
    } catch (e) {
      console.error('Could not save session email', e);
    }
  }, [state.currentUserEmail]);

  // Async API Helper: Create Transaction (Integrated with MySQL DB)
  const createTransactionApi = async (tx: Partial<Transaction>) => {
    const res = await transactionsApi.create(tx);
    const savedData = res?.data || tx;
    dispatch({ type: 'ADD_TRANSACTION', payload: savedData });
    return savedData;
  };

  // Async API Helper: Update Transaction (Integrated with MySQL DB)
  const updateTransactionApi = async (id: string, tx: Partial<Transaction>) => {
    const res = await transactionsApi.update(id, tx);
    const updatedData = res?.data || { ...tx, id };
    dispatch({ type: 'EDIT_TRANSACTION', payload: updatedData });
    return updatedData;
  };

  // Async API Helper: Delete Transaction (Integrated with MySQL DB)
  const deleteTransactionApi = async (id: string) => {
    await transactionsApi.delete(id);
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  };

  // Async API Helper: Create Asset (Integrated with MySQL DB)
  const createAssetApi = async (asset: any) => {
    const res = await assetsApi.create(asset);
    const savedData = res?.data || asset;
    dispatch({ type: 'ADD_ASSET', payload: savedData });
    return savedData;
  };

  // Async API Helper: Update Asset (Integrated with MySQL DB)
  const updateAssetApi = async (id: string, asset: any) => {
    const res = await assetsApi.update(id, asset);
    const updatedData = res?.data || { ...asset, id };
    dispatch({ type: 'EDIT_ASSET', payload: updatedData });
    return updatedData;
  };

  // Async API Helper: Delete Asset (Integrated with MySQL DB)
  const deleteAssetApi = async (id: string) => {
    await assetsApi.delete(id);
    dispatch({ type: 'DELETE_ASSET', payload: id });
  };

  // Async API Helper: Create COA Account (Integrated with MySQL DB)
  const createCoaApi = async (accountData: any) => {
    const res = await coaApi.create(accountData);
    const savedData = res?.data || accountData;
    dispatch({ type: 'ADD_COA_ACCOUNT', payload: savedData });
    return savedData;
  };

  // Async API Helper: Update COA Account (Integrated with MySQL DB)
  const updateCoaApi = async (id: string, accountData: any) => {
    const res = await coaApi.update(id, accountData);
    const updatedData = res?.data || { ...accountData, id };
    dispatch({ type: 'EDIT_COA_ACCOUNT', payload: updatedData });
    return updatedData;
  };

  // Async API Helper: Delete COA Account (Integrated with MySQL DB)
  const deleteCoaApi = async (id: string) => {
    await coaApi.delete(id);
    dispatch({ type: 'DELETE_COA_ACCOUNT', payload: id });
  };

  // Async API Helper: Upgrade to Pro (Integrated with MySQL DB)
  const upgradeToProApi = async (plan: 'Pro' | 'Enterprise' = 'Pro') => {
    const res = await subscriptionsApi.upgrade(plan);
    dispatch({ type: 'SET_SUBSCRIPTION', payload: 'Pro' });
    return res;
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
      createCoaApi,
      updateCoaApi,
      deleteCoaApi,
      upgradeToProApi
    }}>
      {children}
    </FMSContext.Provider>
  );
};

export const useFMS = () => useContext(FMSContext);