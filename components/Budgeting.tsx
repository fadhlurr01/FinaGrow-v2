import React, { useState, useMemo } from 'react';
import { useFMS } from '../context/FMSContext';
import { useLocalization } from '../hooks/useLocalization';
import { Budget } from '../types';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  HelpCircle,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';

interface BudgetWithMetrics extends Budget {
  accountName: string;
  accountCode: string;
  actualSpent: number;
  remaining: number;
  utilization: number; // percentage
}

const Budgeting: React.FC = () => {
  const { state, dispatch } = useFMS();
  const { language, t } = useLocalization();

  // Selected period filter (e.g., "2024-07")
  const periodsAvailable = useMemo(() => {
    const list = new Set<string>();
    state.budgets.forEach(b => list.add(b.period));
    // Add current period if empty
    list.add(state.activePeriod);
    return Array.from(list).sort().reverse();
  }, [state.budgets, state.activePeriod]);

  const [selectedPeriod, setSelectedPeriod] = useState(state.activePeriod);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Focus budget
  const [activeBudget, setActiveBudget] = useState<BudgetWithMetrics | null>(null);

  // Form Fields
  const [accountId, setAccountId] = useState('AC_5100');
  const [amount, setAmount] = useState(5000000);
  const [period, setPeriod] = useState(state.activePeriod);

  // COA choice list: prefer expense accounts (codes starting with '5') or revenue accounts (codes starting with '4')
  const budgetableCOA = useMemo(() => {
    return state.coa.filter(acc => acc.type === 'Expense' || acc.type === 'Revenue');
  }, [state.coa]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Compile calculations for budgets
  const budgetsWithCalculations = useMemo(() => {
    return state.budgets
      .filter(b => b.period === selectedPeriod && b.entity === state.activeEntity)
      .map(b => {
        const coaAccount = state.coa.find(acc => acc.id === b.accountId);
        const accountName = coaAccount?.name || 'Unknown Account';
        const accountCode = coaAccount?.code || '';

        // Calculate actual spent: sum of transactions in this period where debit (dr) is this account
        const actualSpent = state.transactions
          .filter(tx => {
            const isEntityMatch = tx.entity === b.entity;
            const isPeriodMatch = tx.date.startsWith(b.period);
            const isTargetAccount = tx.dr === b.accountId || tx.cr === b.accountId;
            // Ensure indeed transaction affects it (excluding internal transfers between identical codes)
            return isEntityMatch && isPeriodMatch && isTargetAccount;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);

        const remaining = b.amount - actualSpent;
        const utilization = b.amount > 0 ? (actualSpent / b.amount) * 100 : 0;

        return {
          ...b,
          accountName,
          accountCode,
          actualSpent,
          remaining,
          utilization
        };
      });
  }, [state.budgets, state.transactions, state.coa, selectedPeriod, state.activeEntity]);

  // Overall calculations
  const summary = useMemo(() => {
    let totalBudgeted = 0;
    let totalActual = 0;
    let exceededCount = 0;

    budgetsWithCalculations.forEach(b => {
      totalBudgeted += b.amount;
      totalActual += b.actualSpent;
      if (b.utilization > 100) {
        exceededCount++;
      }
    });

    const netRemaining = totalBudgeted - totalActual;
    const overallUtilization = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

    return {
      totalBudgeted,
      totalActual,
      netRemaining,
      overallUtilization,
      exceededCount
    };
  }, [budgetsWithCalculations]);

  // Handle Add Budget
  const handleAddBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    // Check if duplicate budget already exists for this account & period
    const duplicate = state.budgets.find(b => 
      b.accountId === accountId && 
      b.period === period && 
      b.entity === state.activeEntity
    );

    if (duplicate) {
      alert(language === 'id' 
        ? 'Anggaran untuk akun dan periode ini sudah ada. Anda bisa mengubahnya saja.' 
        : 'Budget for this account & month already exists. Please edit instead.');
      return;
    }

    dispatch({
      type: 'ADD_BUDGET',
      payload: {
        accountId,
        period,
        amount,
        entity: state.activeEntity
      }
    });

    setIsAddModalOpen(false);
    setAmount(5000000);
  };

  // Handle Edit Budget open
  const openEditModal = (b: BudgetWithMetrics) => {
    setActiveBudget(b);
    setAccountId(b.accountId);
    setAmount(b.amount);
    setPeriod(b.period);
    setIsEditModalOpen(true);
  };

  // Handle Edit Budget save
  const handleEditBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBudget || amount <= 0) return;

    dispatch({
      type: 'EDIT_BUDGET',
      payload: {
        ...activeBudget,
        accountId,
        period,
        amount
      }
    });

    setIsEditModalOpen(false);
    setActiveBudget(null);
  };

  // Handle Delete Budget Open
  const openDeleteModal = (b: BudgetWithMetrics) => {
    setActiveBudget(b);
    setIsDeleteModalOpen(true);
  };

  // Handle Delete Budget Confirm
  const confirmDeleteBudget = () => {
    if (!activeBudget) return;
    dispatch({
      type: 'DELETE_BUDGET',
      payload: activeBudget.id
    });
    setIsDeleteModalOpen(false);
    setActiveBudget(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-primary-600 dark:text-primary-450" />
            <span>{language === 'id' ? 'Anggaran & Analisis Fiskal' : 'Budgeting & Fiscal Analysis'}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {language === 'id' ? 'Tetapkan pagu pengeluaran, batasi pemborosan, dan pantau realisasi dana real-time.' : 'Set control ceilings, limit over-expenditures, and benchmark real-time spending vs. allocations.'}
          </p>
        </div>

        {/* Filter & Add Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 px-3 py-2 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto transition-all">
            <Calendar className="w-3.5 h-3.5 text-primary-500 animate-pulse" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-805 dark:text-slate-100 focus:outline-none cursor-pointer px-1 py-1"
            >
              {periodsAvailable.map(p => (
                <option key={p} value={p} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs">
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="whitespace-nowrap flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>{language === 'id' ? 'Bikin Anggaran' : 'Set Budget'}</span>
          </button>
        </div>
      </div>

      {/* 2. STAT COMPARISONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-2">
            {language === 'id' ? 'PAGU ANGGARAN (ALLOCATED)' : 'TOTAL BUDGET LIMITS'}
          </span>
          <h3 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
            {formatMoney(summary.totalBudgeted)}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            {language === 'id' ? `Total batas belanja untuk ${selectedPeriod}` : `Cap limit across ${selectedPeriod}`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-855 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest block mb-2">
            {language === 'id' ? 'REALISASI BELANJA (ACTUAL)' : 'ACTUAL ABSORBED'}
          </span>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {formatMoney(summary.totalActual)}
          </h3>
          <p className="text-[10px] text-indigo-500 font-bold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
            <span>{summary.overallUtilization.toFixed(1)}% {language === 'id' ? 'anggaran terserap' : 'absorbed'}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-855 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-2">
            {language === 'id' ? 'SISA MARGIN (SURPLUS)' : 'SURPLUS COMPLIANCE'}
          </span>
          <h3 className={`text-2xl font-black tracking-tight ${summary.netRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`}>
            {formatMoney(summary.netRemaining)}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            {summary.netRemaining >= 0 
              ? (language === 'id' ? 'Pengeluaran di bawah anggaran' : 'Favorable budget balance')
              : (language === 'id' ? 'Melebihi batas aman!' : 'Deficit bounds overspent!')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-855 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block mb-2">
            {language === 'id' ? 'ANGGARAN OVERBEATEN' : 'OVERBUDGET ENTRIES'}
          </span>
          <h3 className={`text-2xl font-black tracking-tight ${summary.exceededCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {summary.exceededCount} {language === 'id' ? 'Akun' : 'Accounts'}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 inline-flex items-center gap-1 font-semibold">
            {summary.exceededCount > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'id' ? 'Ambil tindakan proteksi' : 'Exceeds spending ceiling'}</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'id' ? 'Seluruh anggaran aman' : 'All accounts spend-compliant'}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* 3. DETAILED LIST WITH METRIC PROGRESS BARS */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="text-sm font-black text-slate-855 dark:text-white uppercase tracking-wider">
            {language === 'id' ? 'Peninjauan Detil Alokasi Kas' : 'Cost Center Budget Allocation Review'}
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
            {language === 'id' ? 'Kelola alokasi akun, pantau rincian biaya yang keluar dari jurnal akuntansi secara otomatis.' : 'Reconcile real expenditures compiled instantly from accounts ledgers vs monthly set capacities.'}
          </p>
        </div>

        {/* List Grid */}
        <div className="p-5 space-y-5">
          {budgetsWithCalculations.map((item) => {
            // Colors based on spending
            const runRate = item.utilization;
            let barColor = 'bg-emerald-500 dark:bg-emerald-650';
            let textColor = 'text-emerald-600 dark:text-emerald-450';
            let bgLight = 'bg-emerald-50 dark:bg-emerald-950/20';
            
            if (runRate >= 100) {
              barColor = 'bg-rose-500 dark:bg-rose-650 animate-pulse';
              textColor = 'text-rose-600 dark:text-rose-455';
              bgLight = 'bg-rose-50 dark:bg-rose-950/20';
            } else if (runRate >= 75) {
              barColor = 'bg-amber-500';
              textColor = 'text-amber-600 dark:text-amber-450';
              bgLight = 'bg-amber-50 dark:bg-amber-950/20';
            }

            return (
              <div 
                key={item.id}
                className="p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/40 dark:hover:bg-slate-700/20 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  {/* Title & SKU */}
                  <div>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-1 rounded font-bold">
                      {item.accountCode}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white mt-1.5">{item.accountName}</h4>
                  </div>

                  {/* Pricing metrics */}
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap items-center gap-4 sm:gap-6 text-xs font-bold text-slate-600 dark:text-slate-350 w-full sm:w-auto">
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-semibold">{language === 'id' ? 'DIPESANKAN' : 'BUDGET'}</span>
                      <span className="text-slate-800 dark:text-white block mt-0.5">{formatMoney(item.amount)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-505 uppercase tracking-wider block font-semibold">{language === 'id' ? 'TERALOKASI' : 'ACTUAL SPENT'}</span>
                      <span className="text-slate-800 dark:text-white block mt-0.5">{formatMoney(item.actualSpent)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-505 uppercase tracking-wider block font-semibold">{language === 'id' ? 'SISA MARGIN' : 'REMAINING'}</span>
                      <span className={`block mt-0.5 ${item.remaining >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatMoney(item.remaining)}
                      </span>
                    </div>

                    {/* Actions button directly visible in rows! */}
                    <div className="flex items-center gap-1.5 pl-0 sm:pl-2 sm:border-l border-slate-100 dark:border-slate-700/50 pt-2 sm:pt-0 col-span-2 xs:col-span-1 justify-end sm:justify-start">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        title={language === 'id' ? 'Ubah' : 'Edit'}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(item)}
                        title={language === 'id' ? 'Hapus' : 'Delete'}
                        className="p-1.5 text-slate-405 hover:text-rose-550 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress bar element */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-extrabold tracking-tight">
                    <span className="text-slate-450 dark:text-slate-500">Utilization metrics:</span>
                    <span className={textColor}>{runRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(runRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}

          {budgetsWithCalculations.length === 0 && (
            <div className="py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center">
              <span className="inline-flex p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-550 rounded-full mb-3">
                <HelpCircle className="w-6 h-6" />
              </span>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">
                {language === 'id' ? 'Pagu Belanja Kosong' : 'No Budgets Programmed'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-405 mt-1 max-w-sm mx-auto leading-relaxed">
                {language === 'id' 
                  ? 'Anda belum menetapkan batasan kuota fiskal untuk entitas ini pada bulan terpilih.'
                  : 'Establish fiscal benchmarks for expense accounts to keep team tracks compliant.'}
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-850 dark:text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {language === 'id' ? 'Set Target Baru' : 'Set First Target'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. SET BUDGET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-905/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-705 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800 dark:text-white animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span>{language === 'id' ? 'Buat Pembatasan Anggaran' : 'Set New Cap'}</span>
              </h3>
            </div>

            <form onSubmit={handleAddBudgetSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  {language === 'id' ? 'KUNCI AKUN BIAYA & PENDAPATAN' : 'TARGET LEDGER ACCOUNT'}
                </label>
                <select 
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {budgetableCOA.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    {language === 'id' ? 'BULAN FISKAL' : 'FISCAL TARGET PERIOD'}
                  </label>
                  <input 
                    type="month" 
                    required
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-705 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    {language === 'id' ? 'JUMLAH PAGU (IDR)' : 'MAX AMOUNT (CAP)'}
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-205 cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Kunci Kuota' : 'Lock Capacity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. EDIT BUDGET MODAL */}
      {isEditModalOpen && activeBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-905/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-705 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800 dark:text-white animate-in fade-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                <Pencil className="w-4 h-4 text-indigo-500" />
                <span>{language === 'id' ? 'Sesuaikan Anggaran' : 'Adjust Allocation'}</span>
              </h3>
            </div>

            <form onSubmit={handleEditBudgetSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Account (Read Only)
                </label>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                  {activeBudget.accountCode} - {activeBudget.accountName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Period</label>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 border border-slate-100 dark:border-slate-700">
                    {activeBudget.period}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    {language === 'id' ? 'BATAS PAGU YANG BARU' : 'ADJUSTED CAP (IDR)'}
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-205 cursor-pointer"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Perbarui Anggaran' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION POPUP MODAL */}
      {isDeleteModalOpen && activeBudget && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-910/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-center text-slate-800 dark:text-white animate-in zoom-in-95 duration-250">
            
            {/* Warning Glow Icon */}
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-955/20 rounded-full flex items-center justify-center text-rose-550 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black tracking-tight leading-snug">
              {language === 'id' ? 'Hapus Anggaran Akun?' : 'Delete Budget Rule?'}
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === 'id' 
                ? `Apakah anda yakin ingin menghapus alokasi anggaran belanja untuk akun ${activeBudget.accountName} (${activeBudget.accountCode}) pada periode ${activeBudget.period}?`
                : `This will erase files benchmark limits and remove tracking gauges for ${activeBudget.accountName} for period ${activeBudget.period}.`}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {language === 'id' ? 'Batal' : 'No, Keep'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteBudget}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {language === 'id' ? 'Ya, Hapus' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgeting;
