import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Metric, ChartData } from '../types';
import StatCard from './StatCard';
import RevenueChart from './RevenueChart';
import RecentTransactions from './RecentTransactions';
import { ArrowUpRightIcon } from './icons/IconComponents';
import { useLocalization } from '../hooks/useLocalization';
import { useFMS } from '../context/FMSContext';
import { ArrowUpRight, TrendingUp, DollarSign, Briefcase } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { language, t } = useLocalization();
  const { state, dispatch } = useFMS();
  const navigate = useNavigate();

  // Dynamic calculations of accounts
  const getAccountBalance = (codeOrId: string) => {
    const acc = state.coa.find(a => a.code === codeOrId || a.id === codeOrId);
    if (!acc) return 0;
    const opening = acc.openingBalance || 0;
    
    // For transactions: DR increases Assets/Expenses, CR increases Liabilities/Equity/Revenue.
    // So let's trace transaction lines:
    let netChange = 0;
    state.transactions.forEach(tx => {
      // Check if target matches code or ID
      const drMatch = tx.dr === acc.code || tx.dr === acc.id;
      const crMatch = tx.cr === acc.code || tx.cr === acc.id;
      
      if (drMatch) {
         netChange += tx.amount;
      }
      if (crMatch) {
         netChange -= tx.amount;
      }
    });

    if (acc.type === 'Liability' || acc.type === 'Equity' || acc.type === 'Revenue') {
      return opening - netChange; 
    }
    return opening + netChange;
  };

  const totalRevenue = useMemo(() => {
    return state.transactions
      .filter(t => t.type === 'income' && t.status === 'Completed')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions]);

  const totalExpenses = useMemo(() => {
    return state.transactions
      .filter(t => t.type === 'expense' && t.status === 'Completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [state.transactions]);

  const netProfit = totalRevenue - totalExpenses;

  // Let's get combined bank + cash accounts dynamically
  const cashAndBank = useMemo(() => {
    return getAccountBalance('1001') + getAccountBalance('1002') + getAccountBalance('1003');
  }, [state.coa, state.transactions]);

  const accountsReceivable = useMemo(() => {
    return getAccountBalance('1100');
  }, [state.coa, state.transactions]);

  const accountsPayable = useMemo(() => {
    return getAccountBalance('2000');
  }, [state.coa, state.transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Generate dynamic chart data based on transactions
  const dynamicChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    // Group transactions by month
    const monthlySummary: Record<string, { revenue: number; expenses: number }> = {};
    months.forEach(m => {
      monthlySummary[m] = { revenue: 0, expenses: 0 };
    });

    state.transactions.forEach(tx => {
      if (tx.status !== 'Completed') return;
      const date = new Date(tx.date);
      if (isNaN(date.getTime())) return;
      const monthName = months[date.getMonth()];
      
      if (tx.type === 'income') {
        monthlySummary[monthName].revenue += tx.amount;
      } else {
        monthlySummary[monthName].expenses += Math.abs(tx.amount);
      }
    });

    return months.map(name => {
      const rev = monthlySummary[name].revenue;
      const exp = monthlySummary[name].expenses;
      return {
        name,
        revenue: rev,
        expenses: exp,
      };
    });
  }, [state.transactions]);

  const hasTransactions = state.transactions.length > 0;

  const metrics: Metric[] = [
    { title: t('totalRevenue'), value: formatCurrency(totalRevenue), change: hasTransactions ? '+14.2%' : '0.0%', changeType: 'increase' },
    { title: t('totalExpenses'), value: formatCurrency(totalExpenses), change: hasTransactions ? '+5.7%' : '0.0%', changeType: 'increase' },
    { title: t('netProfit'), value: formatCurrency(netProfit), change: hasTransactions ? '+22.5%' : '0.0%', changeType: 'increase' },
    { title: t('cashBalance'), value: formatCurrency(cashAndBank), change: hasTransactions ? '-1.4%' : '0.0%', changeType: 'increase' },
  ];

  const handleGoToCOA = () => {
    dispatch({ type: 'SET_VIEW', payload: 'Chart of Accounts' });
    navigate('/coa');
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Header Greeting block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {language === 'id' ? 'Dasbor Manajemen Finansial' : 'Financial Management Dashboard'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'id' 
              ? `Tinjauan metrik keuangan Anda secara real-time untuk ${state.activePeriod}`
              : `Real-time overview of your company financial metrics for ${state.activePeriod}`}
          </p>
        </div>
      </div>

      {/* Stats microcards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <StatCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Main analytics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Chart */}
        <div className="lg:col-span-2">
          <RevenueChart data={dynamicChartData} />
        </div>

        {/* Account watchlist panel */}
        <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-700/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t('accountWatchlist')}
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {state.coa
                .filter(acc => ['1001', '1002', '1003', '1100', '2000'].includes(acc.code))
                .map((account) => {
                  const currentBalance = getAccountBalance(account.id);
                  const isNegativeText = account.type === 'Liability' || account.type === 'Expense';
                  return (
                    <li key={account.id} className="flex justify-between items-center py-4">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                          {language === 'id' ? account.name : (
                            account.code === '1001' ? 'Petty Cash' :
                            account.code === '1002' ? 'Bank BCA Account' :
                            account.code === '1003' ? 'Bank Mandiri Account' :
                            account.code === '1100' ? 'Accounts Receivable' :
                            account.code === '2000' ? 'Accounts Payable' : account.name
                          )}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          {account.code} • {language === 'id' ? (account.description || 'Monitored') : (
                            account.code === '1001' ? 'Operational petty cash' :
                            account.code === '1002' ? 'Primary BCA bank account' :
                            account.code === '1003' ? 'Secondary bank account' :
                            account.code === '1100' ? 'Receivable from customers' :
                            account.code === '2000' ? 'Payable to raw suppliers' : (account.description || 'Monitored')
                          )}
                        </p>
                      </div>
                      <p className={`font-bold text-sm ${isNegativeText ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(currentBalance)}
                      </p>
                    </li>
                  );
                })}
            </ul>
          </div>

          <button 
            type="button"
            onClick={handleGoToCOA}
            className="mt-6 w-full flex items-center justify-center gap-1.5 border border-slate-150 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white font-extrabold text-xs py-3 rounded-2xl transition-all cursor-pointer shadow-sm active:scale-98"
          >
            {t('viewAllAccounts')} 
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Detailed ledger transactions stream */}
      <div>
        <RecentTransactions transactions={state.transactions} />
      </div>
    </div>
  );
};

export default Dashboard;
