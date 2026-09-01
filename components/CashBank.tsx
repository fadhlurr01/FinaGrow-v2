import React, { useState, useMemo } from 'react';
import { useFMS } from '../context/FMSContext';
import { useLocalization } from '../hooks/useLocalization';
import { useTheme } from '../hooks/useTheme';
import { 
  Plus, 
  ArrowLeftRight, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Wallet, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface TransferFormData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: string;
}

interface DepositFormData {
  accountId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

const CashBank: React.FC = () => {
  const { state, dispatch } = useFMS();
  const { language, t } = useLocalization();
  const { theme } = useTheme();

  // Selected Bank Account filter
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Forms states
  const [transferForm, setTransferForm] = useState<TransferFormData>({
    fromAccountId: 'AC_1002',
    toAccountId: 'AC_1001',
    amount: 1000000,
    description: '',
    date: new Date().toISOString().slice(0, 10)
  });

  const [depositForm, setDepositForm] = useState<DepositFormData>({
    accountId: 'AC_1002',
    type: 'income',
    category: 'Sales',
    amount: 5000000,
    description: '',
    date: new Date().toISOString().slice(0, 10)
  });

  // Fetch only Cash & Bank accounts from Chart of Accounts
  const cashBankAccounts = useMemo(() => {
    return state.coa.filter(acc => 
      acc.id === 'AC_1001' || acc.id === 'AC_1002' || acc.id === 'AC_1003' ||
      acc.name.toLowerCase().includes('kas') || 
      acc.name.toLowerCase().includes('bank')
    );
  }, [state.coa]);

  // Calculate live balances dynamically based on journal transactions
  // Cash & Bank are asset accounts -> increase on debit (dr), decrease on credit (cr)
  const accountBalances = useMemo(() => {
    const balances: { [accountId: string]: number } = {};
    
    // Initialize with opening balances
    cashBankAccounts.forEach(acc => {
      balances[acc.id] = acc.openingBalance || 0;
    });

    // Populate with transaction additions/subtractions
    state.transactions.forEach(tx => {
      // If debited, this account balance increases
      if (balances[tx.dr] !== undefined) {
        balances[tx.dr] += tx.amount;
      }
      // If credited, this account balance decreases
      if (balances[tx.cr] !== undefined) {
        balances[tx.cr] -= tx.amount;
      }
    });

    return balances;
  }, [cashBankAccounts, state.transactions]);

  // Combined metrics
  const totalBalance = useMemo(() => {
    return (Object.values(accountBalances) as number[]).reduce((sum, val) => sum + val, 0);
  }, [accountBalances]);

  const totalInflow = useMemo(() => {
    return state.transactions
      .filter(tx => tx.type === 'income' && cashBankAccounts.some(acc => acc.id === tx.dr))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [state.transactions, cashBankAccounts]);

  const totalOutflow = useMemo(() => {
    return state.transactions
      .filter(tx => tx.type === 'expense' && cashBankAccounts.some(acc => acc.id === tx.cr))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [state.transactions, cashBankAccounts]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter transactions related to selected Cash/Bank accounts
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(tx => {
      // Must concern at least one cash/bank account
      const concernsCashBank = cashBankAccounts.some(acc => acc.id === tx.dr || acc.id === tx.cr);
      if (!concernsCashBank) return false;

      // Filter by specific account if chosen
      if (selectedAccountId !== 'all') {
        const matchesAccount = tx.dr === selectedAccountId || tx.cr === selectedAccountId;
        if (!matchesAccount) return false;
      }

      // Filter by search terms
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = tx.description?.toLowerCase().includes(term);
        const matchesCategory = tx.category?.toLowerCase().includes(term);
        const matchesType = tx.type?.toLowerCase().includes(term);
        const matchesVendor = tx.vendor?.toLowerCase().includes(term);
        const matchesCustomer = tx.customer?.toLowerCase().includes(term);
        return matchesDesc || matchesCategory || matchesType || matchesVendor || matchesCustomer;
      }

      return true;
    });
  }, [state.transactions, selectedAccountId, searchTerm, cashBankAccounts]);

  // Handle Transfer Action
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.amount <= 0 || transferForm.fromAccountId === transferForm.toAccountId) {
      alert(language === 'id' ? 'Akun asal dan tujuan tidak boleh sama' : 'Source and destination accounts must be different');
      return;
    }

    const fromAccName = state.coa.find(c => c.id === transferForm.fromAccountId)?.name || 'Account';
    const toAccName = state.coa.find(c => c.id === transferForm.toAccountId)?.name || 'Account';

    // Dispatches a transaction
    // Dr target asset (increase), Cr source asset (decrease)
    const newTx = {
      date: transferForm.date,
      entity: state.activeEntity,
      description: transferForm.description || `${language === 'id' ? 'Transfer dana dari' : 'Fund transfer from'} ${fromAccName} ${language === 'id' ? 'ke' : 'to'} ${toAccName}`,
      dr: transferForm.toAccountId,
      cr: transferForm.fromAccountId,
      amount: transferForm.amount,
      cur: state.currency,
      type: 'expense',
      category: 'Transfer',
      status: 'Completed',
      paymentMethod: 'Bank Transfer'
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: newTx });
    setIsTransferModalOpen(false);
    // Reset description
    setTransferForm(prev => ({ ...prev, description: '', amount: 1000000 }));
  };

  // Handle Deposit / Expense Action
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositForm.amount <= 0) return;

    const accName = state.coa.find(c => c.id === depositForm.accountId)?.name || 'Account';
    
    // If income: Dr Cash/Bank Asset (increase), Cr Revenue/Equity Account (e.g., AC_4000)
    // If expense: Dr Expense Account (e.g., AC_5100), Cr Cash/Bank Asset (decrease)
    let drAccount = '';
    let crAccount = '';

    if (depositForm.type === 'income') {
      drAccount = depositForm.accountId; // Debited -> cash increases
      crAccount = 'AC_4000'; // Credited -> Revenue
    } else {
      drAccount = 'AC_5300'; // Debited -> Operations Expense
      crAccount = depositForm.accountId; // Credited -> cash decreases
    }

    const newTx = {
      date: depositForm.date,
      entity: state.activeEntity,
      description: depositForm.description || `${depositForm.type === 'income' ? 'Setoran' : 'Penarikan'} ${accName}`,
      dr: drAccount,
      cr: crAccount,
      amount: depositForm.amount,
      cur: state.currency,
      type: depositForm.type,
      category: depositForm.category,
      status: 'Completed',
    };

    dispatch({ type: 'ADD_TRANSACTION', payload: newTx });
    setIsDepositModalOpen(false);
    setDepositForm(prev => ({ ...prev, description: '', amount: 1000000 }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with modern layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-primary-600 dark:text-primary-450" />
            <span>{language === 'id' ? 'Manajemen Kas & Bank' : 'Cash & Bank Management'}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {language === 'id' ? 'Kelola likuiditas, rekon instan, transfer dana, dan tinjau arus kas real-time.' : 'Monitor liquidity, reconcile instantly, transfer cash pools, and track cashflows.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2.5 w-full sm:w-auto">
          <button
  type="button"
  onClick={() => setIsTransferModalOpen(true)}
  className="
    flex-1 sm:flex-initial
    flex items-center justify-center gap-2
    bg-white hover:bg-slate-50
    dark:bg-slate-800 dark:hover:bg-slate-700
    text-slate-800 dark:text-white
    border border-slate-200 dark:border-slate-700
    text-xs font-black uppercase tracking-wider
    py-3 px-4 rounded-xl
    shadow-sm transition cursor-pointer
  "
>
  <ArrowLeftRight className="w-4 h-4 text-primary-600" />
  <span>
    {language === 'id' ? 'Kirim Transfer' : 'Transfer Funds'}
  </span>
</button>
          
          <button
            type="button"
            onClick={() => setIsDepositModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>{language === 'id' ? 'Transaksi Kas' : 'New Cash Tx'}</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS OR HIGH INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {language === 'id' ? 'SALDO KAS KUMULATIF' : 'TOTAL LIQUID CASH POOLS'}
            </span>
            <Wallet className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
            {formatMoney(totalBalance)}
          </h3>
          <p className="text-[10.5px] text-emerald-500 font-bold mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'id' ? 'Likuiditas terpantau aman' : 'Treasury liquidity is optimal'}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              {language === 'id' ? 'TOTAL DEPOSIT MASUK' : 'TOTAL MONETARY INFLOW'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-450 tracking-tight">
            {formatMoney(totalInflow)}
          </h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1.5">
            {language === 'id' ? 'Melalui setoran & pelunasan piutang' : 'Via direct bank deposits & AR'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
              {language === 'id' ? 'TOTAL DEBIT PENARIKAN' : 'TOTAL OUTFLOW'}
            </span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-rose-600 dark:text-rose-450 tracking-tight">
            {formatMoney(totalOutflow)}
          </h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1.5">
            {language === 'id' ? 'Melalui pengeluaran biaya operasional' : 'Via operations, costs & AP pay'}
          </p>
        </div>
      </div>

      {/* 3. DYNAMIC DIGITAL BANK CARDS LAYOUT */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
          {language === 'id' ? 'Rekening Kas Aktif' : 'Liquid Financial Accounts'}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cashBankAccounts.map((account, idx) => {
            const accBalance = accountBalances[account.id] || 0;
            
            // Premium light/dark card schemes
            const cardStyles = [
              // Index 0: Kas Utama / Cash
              {
                containerClass: theme === 'light' 
                  ? 'bg-gradient-to-tr from-slate-50 to-slate-100 border-slate-205 text-slate-850 shadow-sm'
                  : 'from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 border-slate-650 text-white',
                headerTextClass: theme === 'light' ? 'text-slate-900 font-black' : 'text-white font-black',
                descTextClass: theme === 'light' ? 'text-slate-500 font-bold' : 'text-slate-300 opacity-75',
                metaClass: theme === 'light' ? 'bg-slate-200/60 text-slate-700' : 'bg-white/20 text-white',
                numberClass: theme === 'light' ? 'text-slate-400 font-mono' : 'text-white/60 font-mono',
                iconClass: theme === 'light' ? 'text-slate-700' : 'text-white opacity-90',
                titleMeta: theme === 'light' ? 'text-slate-400' : 'text-white/60',
                balanceClass: theme === 'light' ? 'text-slate-900' : 'text-white'
              },
              // Index 1: Bank Mandiri
              {
                containerClass: theme === 'light' 
                  ? 'bg-gradient-to-tr from-emerald-50/80 to-teal-50/70 border-emerald-200 text-emerald-950 shadow-sm'
                  : 'from-emerald-600 to-teal-800 dark:from-emerald-900 dark:to-emerald-950 border-emerald-600 text-white',
                headerTextClass: theme === 'light' ? 'text-emerald-900 font-black' : 'text-white font-black',
                descTextClass: theme === 'light' ? 'text-emerald-700 font-bold' : 'text-slate-300 opacity-75',
                metaClass: theme === 'light' ? 'bg-emerald-100 text-emerald-800' : 'bg-white/20 text-white',
                numberClass: theme === 'light' ? 'text-emerald-700/60 font-mono' : 'text-white/60 font-mono',
                iconClass: theme === 'light' ? 'text-emerald-800' : 'text-white opacity-90',
                titleMeta: theme === 'light' ? 'text-emerald-600/70' : 'text-white/60',
                balanceClass: theme === 'light' ? 'text-emerald-900' : 'text-white'
              },
              // Index 2: Bank BCA
              {
                containerClass: theme === 'light' 
                  ? 'bg-gradient-to-tr from-indigo-50/80 to-blue-50/70 border-indigo-200 text-indigo-950 shadow-sm'
                  : 'from-indigo-600 to-purple-800 dark:from-indigo-900 dark:to-purple-950 border-indigo-600 text-white',
                headerTextClass: theme === 'light' ? 'text-indigo-900 font-black' : 'text-white font-black',
                descTextClass: theme === 'light' ? 'text-indigo-700 font-bold' : 'text-slate-300 opacity-75',
                metaClass: theme === 'light' ? 'bg-indigo-100 text-indigo-800' : 'bg-white/20 text-white',
                numberClass: theme === 'light' ? 'text-indigo-700/60 font-mono' : 'text-white/60 font-mono',
                iconClass: theme === 'light' ? 'text-indigo-800' : 'text-white opacity-90',
                titleMeta: theme === 'light' ? 'text-indigo-650' : 'text-white/60',
                balanceClass: theme === 'light' ? 'text-indigo-900' : 'text-white'
              }
            ];

            const activeStyle = cardStyles[idx % cardStyles.length];
            const fakeCardNumber = `•••• •••• •••• ${account.code || '1000'}`;

            return (
              <div 
                key={account.id}
                onClick={() => setSelectedAccountId(selectedAccountId === account.id ? 'all' : account.id)}
                className={`relative overflow-hidden cursor-pointer p-6 rounded-2xl border shadow-md transition-all duration-300 hover:scale-[1.025] hover:shadow-lg bg-gradient-to-tr ${activeStyle.containerClass} ${
                  selectedAccountId === account.id ? 'ring-4 ring-primary-550 border-primary-550' : ''
                }`}
              >
                {/* Visual Glassmorphic Accent */}
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl -translate-y-4 translate-x-4"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className={`text-base tracking-tight ${activeStyle.headerTextClass}`}>{account.name}</h4>
                    <span className={`text-[10px] uppercase tracking-widest ${activeStyle.descTextClass}`}>{account.description || 'Cash Pool'}</span>
                  </div>
                  <CreditCard className={`w-5 h-5 ${activeStyle.iconClass}`} />
                </div>

                <div className="space-y-4">
                  <div className={`text-sm tracking-widest ${activeStyle.numberClass}`}>{fakeCardNumber}</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className={`text-[9px] uppercase block leading-none font-bold ${activeStyle.titleMeta}`}>{language === 'id' ? 'SALDO TERSEDIA' : 'REAL balance'}</span>
                      <span className={`text-xl font-black tracking-tight mt-1 inline-block ${activeStyle.balanceClass}`}>{formatMoney(accBalance)}</span>
                    </div>
                    <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest ${activeStyle.metaClass}`}>
                      {language === 'id' ? 'REKENING UTAMA' : 'PRIMARY'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS FILTERED */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col md:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700/50 gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">
              {language === 'id' ? 'Histori Transaksi Arus Kas' : 'Cash Ledger Journal Summary'}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
              {language === 'id' ? 'Menampilkan riwayat kas masuk-keluar untuk akun kas yang terpilih.' : 'Displaying bank statements, debit alerts, and cash book listings matches filters.'}
            </p>
          </div>

          {/* Search/Fitler tools */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={language === 'id' ? 'Filter deskripsi...' : 'Search descriptions...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-slate-800 dark:text-slate-100 pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-400 dark:placeholder-slate-550"
              />
            </div>

            {/* Filter select */}
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{language === 'id' ? 'Semua Rekening' : 'All Accounts'}</option>
              {cashBankAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-405 dark:text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/50">
              <tr>
                <th className="px-6 py-4">{language === 'id' ? 'Tanggal' : 'Date'}</th>
                <th className="px-6 py-4">{language === 'id' ? 'Deskripsi' : 'Description'}</th>
                <th className="px-6 py-4">{language === 'id' ? 'Debet (Masuk)' : 'Debit (Dr)'}</th>
                <th className="px-6 py-4">{language === 'id' ? 'Kredit (Keluar)' : 'Credit (Cr)'}</th>
                <th className="px-6 py-4 text-right">{language === 'id' ? 'Jumlah' : 'Amount'}</th>
                <th className="px-6 py-4 text-center">{language === 'id' ? 'Status' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-slate-700 dark:text-slate-300">
              {filteredTransactions.map((tx) => {
                const isDebit = cashBankAccounts.some(acc => acc.id === tx.dr);
                const drAccountName = state.coa.find(acc => acc.id === tx.dr)?.name || tx.dr;
                const crAccountName = state.coa.find(acc => acc.id === tx.cr)?.name || tx.cr;

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4.5 font-semibold text-slate-440 dark:text-slate-400">{tx.date}</td>
                    <td className="px-6 py-4.5 font-bold text-slate-850 dark:text-slate-105">
                      <div>{tx.description}</div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal inline-block mt-0.5">
                        Category: {tx.category || 'Operational'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-slate-500 dark:text-slate-440 max-w-[120px] truncate">{drAccountName}</td>
                    <td className="px-6 py-4.5 text-slate-500 dark:text-slate-440 max-w-[120px] truncate">{crAccountName}</td>
                    <td className="px-6 py-4.5 text-right font-black">
                      <span className={isDebit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-850 dark:text-white'}>
                        {isDebit ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        tx.status === 'Completed' || tx.status === 'Paid'
                           ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                           : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {tx.status === 'Completed' || tx.status === 'Paid' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>{language === 'id' ? 'Lunas' : 'Completed'}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>{language === 'id' ? 'Memproses' : 'Pending'}</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-bold">
                    {language === 'id' ? 'Tidak terdapat catatan arus kas yang cocok.' : 'No cash transactions matches selected filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Deck */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">
              {language === 'id' ? 'Tidak terdapat catatan arus kas yang cocok.' : 'No cash transactions matches selected filters.'}
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isDebit = cashBankAccounts.some(acc => acc.id === tx.dr);
              const drAccountName = state.coa.find(acc => acc.id === tx.dr)?.name || tx.dr;
              const crAccountName = state.coa.find(acc => acc.id === tx.cr)?.name || tx.cr;

              return (
                <div key={tx.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-snug">{tx.description}</h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{tx.date} • Kategori: {tx.category || 'Operational'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                      tx.status === 'Completed' || tx.status === 'Paid'
                        ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-amber-100/80 text-amber-700 dark:bg-amber-955/40 dark:text-amber-400'
                    }`}>
                      {tx.status === 'Completed' || tx.status === 'Paid' ? (language === 'id' ? 'SALDO OK' : 'OK') : 'PENDING'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-xl text-[10px] leading-relaxed">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">{language === 'id' ? 'Debet (Masuk)' : 'Debit (Dr)'}</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-400 truncate block">{drAccountName}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">{language === 'id' ? 'Kredit (Keluar)' : 'Credit (Cr)'}</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-400 truncate block">{crAccountName}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('amount')}</span>
                    <span className={`text-sm font-black ${isDebit ? 'text-emerald-500' : 'text-slate-805 dark:text-white'}`}>
                      {isDebit ? '+' : '-'}{formatMoney(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. FUND TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800 dark:text-white animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-primary-500" />
                <span>{language === 'id' ? 'Kirim Transfer Dana' : 'Transfer Funds'}</span>
              </h3>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'REKENING PEMILIH ASAL' : 'SOURCE CASH/BANK ACCOUNT'}</label>
                <select 
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm(p => ({ ...p, fromAccountId: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {cashBankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatMoney(accountBalances[acc.id] || 0)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'REKENING TUJUAN' : 'DESTINATION ACCOUNT'}</label>
                <select 
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm(p => ({ ...p, toAccountId: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {cashBankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatMoney(accountBalances[acc.id] || 0)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'JUMLAH (IDR)' : 'AMOUNT'}</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'TANGGAL' : 'DATE'}</label>
                  <input 
                    type="date" 
                    required
                    value={transferForm.date}
                    onChange={(e) => setTransferForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'CATATAN TRANSFER' : 'MEMO NOTES'}</label>
                <input 
                  type="text" 
                  placeholder={language === 'id' ? 'Misal: Penyeimbangan saldo kas kecil' : 'e.g. Petty cash balance pool reset'}
                  value={transferForm.description}
                  onChange={(e) => setTransferForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-205 cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Setujui Transfer' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. NEW CASH TRANSACTION MODAL */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800 dark:text-white animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>{language === 'id' ? 'Buat Transaksi Kas Baru' : 'Record Cash Transaction'}</span>
              </h3>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'JENIS TRANSAKSI' : 'TYPE'}</label>
                  <select 
                    value={depositForm.type}
                    onChange={(e) => setDepositForm(p => ({ ...p, type: e.target.value as any }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-105 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="income">{language === 'id' ? 'Setoran / Kas Masuk' : 'Cash Deposit (In)'}</option>
                    <option value="expense">{language === 'id' ? 'Penarikan / Kas Keluar' : 'Cash Withdrawal (Out)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'REKENING KAS' : 'CASH ACCOUNT'}</label>
                  <select 
                    value={depositForm.accountId}
                    onChange={(e) => setDepositForm(p => ({ ...p, accountId: e.target.value }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    {cashBankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'Kategori' : 'Category'}</label>
                  <select 
                    value={depositForm.category}
                    onChange={(e) => setDepositForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="Sales">{language === 'id' ? 'Penjualan' : 'Sales'}</option>
                    <option value="Operational">{language === 'id' ? 'Operasional' : 'Operational'}</option>
                    <option value="Payroll">{language === 'id' ? 'Gaji Karyawan' : 'Payroll'}</option>
                    <option value="Marketing">{language === 'id' ? 'Pemasaran' : 'Marketing'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'TANGGAL' : 'DATE'}</label>
                  <input 
                    type="date" 
                    required
                    value={depositForm.date}
                    onChange={(e) => setDepositForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'JUMLAH (IDR)' : 'AMOUNT'}</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm(p => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-550 uppercase tracking-widest mb-1.5">{language === 'id' ? 'KETERANGAN' : 'MEMO DETAILS'}</label>
                  <input 
                    type="text" 
                    placeholder={language === 'id' ? 'Misal: Pembayaran bonus, isi bensin' : 'e.g. Fuel refills, bonuses'}
                    value={depositForm.description}
                    required
                    onChange={(e) => setDepositForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-205 cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Selesai & Catat' : 'Process Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashBank;
