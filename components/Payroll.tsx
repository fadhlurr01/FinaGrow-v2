import React, { useMemo } from 'react';
import { PayrollRun, Metric } from '../types';
import StatCard from './StatCard';
import { PlusIcon, EllipsisVerticalIcon, ClockIcon, CheckCircleIcon, CalendarDaysIcon } from './icons/IconComponents';
import { useLocalization } from '../hooks/useLocalization';
import { useFMS } from '../context/FMSContext';
import { Lock, Sparkles, Check, Flame } from 'lucide-react';

const PayrollStatusBadge: React.FC<{ status: PayrollRun['status'] }> = ({ status }) => {
  const { t } = useLocalization();
  const baseClasses = 'px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5';
  let specificClasses = '';
  let Icon = null;

  switch (status) {
    case 'Completed':
      specificClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      Icon = CheckCircleIcon;
      break;
    case 'In Progress':
      specificClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      Icon = ClockIcon;
      break;
    case 'Scheduled':
      specificClasses = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      Icon = CalendarDaysIcon;
      break;
  }
  const statusKey = status.toLowerCase().replace(/ /g, '');
  return (
    <span className={`${baseClasses} ${specificClasses}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {t(statusKey)}
    </span>
  );
};


const Payroll: React.FC = () => {
  const { language, t } = useLocalization();
  const { state, dispatch } = useFMS();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const payrollMetrics: Metric[] = useMemo(() => {
    const completedRuns = state.payrollRuns.filter(r => r.status === 'Completed');
    const sortedRuns = [...completedRuns].sort((a, b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());
    const lastRunCost = sortedRuns.length > 0 ? sortedRuns[0].totalGross : 0;
    
    let avgNetPay = 0;
    if (sortedRuns.length > 0) {
      // Assuming mock employees sum to ~52 based on earlier values
       avgNetPay = sortedRuns[0].totalNet / 52;
    }

    const ytdCost = completedRuns.reduce((sum, run) => sum + run.totalGross, 0);

    return [
      { title: t('lastPayrollCost'), value: formatCurrency(lastRunCost), change: '+1.2%', changeType: 'increase' },
      { title: t('employeesPaid'), value: '52', change: '+0', changeType: 'increase' }, // Mock value
      { title: t('avgNetPay'), value: formatCurrency(avgNetPay), change: '+1.2%', changeType: 'increase' },
      { title: t('ytdPayrollCost'), value: formatCurrency(ytdCost), change: '+25.8%', changeType: 'increase' },
    ];
  }, [state.payrollRuns, language, state.currency, t]);

  const isPro = state.subscription === 'Pro';

  return (
    <div className="relative min-h-[calc(100vh-10rem)]">
      {/* 1. LOCK SCREEN OVERLAY IF FREE SUBSCRIPTION */}
      {!isPro && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/70 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-600 dark:from-amber-600 dark:to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-6">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white tracking-tight max-w-lg leading-snug">
            {language === 'id' 
              ? 'Fitur Penggajian & PPh Karyawan Terkunci' 
              : 'Payroll & Employee Tax Suite is Locked'}
          </h2>
          
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            {language === 'id' 
              ? 'Lacak gaji kotor kotor, potong pajak PPh 21, BPJS Kesehatan, ketenagakerjaan, serta cetak slip gaji secara masal dan aman otomatis.' 
              : 'Calculate gross employee wages, process PPh 21 tax deductions, social medical BPJS, and bulk generate secure payslips automatically.'}
          </p>

          {/* Premium Spec Card */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-150 dark:border-slate-700 max-w-sm text-left shadow-sm space-y-2.5">
            <div className="font-extrabold text-[11px] text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center justify-between">
              <span>{language === 'id' ? 'MANFAAT AKTIF PRO' : 'PRO ACTIVATED BENEFITS'}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === 'id' ? 'Pelaporan PPh 21 & BPJS Otomatis' : 'Auto PPh 21 employee tax calculation'}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === 'id' ? 'Cetak Slip Gaji Masal & Slip PDF' : 'Bulk dynamic secure payslip exports'}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === 'id' ? 'Kelola Hingga 5 Seat Pengguna' : 'Up to 5 secure team seat assigns'}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_SUBSCRIPTION', payload: 'Pro' })}
            className="mt-8 bg-gradient-to-r from-primary-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>{language === 'id' ? 'Aktifkan Mode Pro Sekarang' : 'Activate Pro Mode Now'}</span>
          </button>
        </div>
      )}

      {/* 2. PAYROLL DATA UI FOR PRO USERS */}
      <div className={`space-y-6 ${!isPro ? 'opacity-25 pointer-events-none select-none filter blur-xs' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {payrollMetrics.map((metric) => (
            <StatCard key={metric.title} {...metric} />
          ))}
        </div>

      <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('payrollHistory')}</h3>
          <button className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700">
              <PlusIcon className="w-4 h-4 mr-2" />
              {t('runNewPayroll')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">{t('payPeriod')}</th>
                <th scope="col" className="px-6 py-3">{t('runDate')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('grossPay')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('taxesAndDeductions')}</th>
                <th scope="col" className="px-6 py-3 text-right">{t('netPay')}</th>
                <th scope="col" className="px-6 py-3 text-center">{t('status')}</th>
                <th scope="col" className="px-6 py-3 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {state.payrollRuns.map((run) => (
                <tr key={run.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {run.payPeriod}
                  </td>
                  <td className="px-6 py-4">{run.runDate}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-white">
                    {formatCurrency(run.totalGross)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800 dark:text-white">
                    {formatCurrency(run.totalTaxes)}
                  </td>
                   <td className="px-6 py-4 text-right font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(run.totalNet)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <PayrollStatusBadge status={run.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Payroll;