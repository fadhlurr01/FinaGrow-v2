import React, { useMemo, useState } from 'react';
import { useFMS } from '../context/FMSContext';
import { useLocalization } from '../hooks/useLocalization';
import { 
  ReceiptPercentIcon,
} from './icons/IconComponents';
import { 
  Search, 
  HelpCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Calendar, 
  Layers, 
  FileSpreadsheet,
  TrendingDown,
  TrendingUp
} from 'lucide-react';

const Tax: React.FC = () => {
  const { language, t } = useLocalization();
  const { state } = useFMS();

  const [searchTerm, setSearchTerm] = useState('');
  const [taxTypeFilter, setTaxTypeFilter] = useState<'all' | 'Output VAT' | 'Input VAT'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate VAT metrics dynamically from AR/AP invoices
  const { outputVat, inputVat, taxTransactions } = useMemo(() => {
    if (state.subscription === 'Free') {
      return { outputVat: 0, inputVat: 0, taxTransactions: [] };
    }

    let outputVat = 0;
    let inputVat = 0;
    const taxTransactions: any[] = [];

    state.invoices.forEach(inv => {
      const vatRate = inv.vat || 0;
      if (vatRate > 0) {
        const taxAmount = inv.amount * (vatRate / 100);
        
        if (inv.type === 'AR') {
          outputVat += taxAmount;
          taxTransactions.push({ ...inv, taxType: 'Output VAT', taxAmount });
        } else if (inv.type === 'AP') {
          inputVat += taxAmount;
          taxTransactions.push({ ...inv, taxType: 'Input VAT', taxAmount });
        }
      }
    });

    // Sort by issue date descending
    taxTransactions.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    return { outputVat, inputVat, taxTransactions };
  }, [state.invoices, state.subscription]);

  const netVat = outputVat - inputVat;
  const netVatLabel = netVat >= 0 
    ? (t('netVatPayable') || (language === 'id' ? 'PPN Kurang Bayar (Net)' : 'Net VAT Payable'))
    : (t('netVatRefundable') || (language === 'id' ? 'PPN Lebih Bayar (Net)' : 'Net VAT Refundable'));

  // Filtering transactions
  const filteredTaxTransactions = useMemo(() => {
    return taxTransactions.filter(tx => {
      const matchesType = taxTypeFilter === 'all' || tx.taxType === taxTypeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = searchTerm ? (
        tx.invoiceNumber.toLowerCase().includes(term) ||
        tx.customer?.name?.toLowerCase().includes(term) ||
        tx.taxType.toLowerCase().includes(term)
      ) : true;
      return matchesType && matchesSearch;
    });
  }, [taxTransactions, taxTypeFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* 1. Header with visual accent */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-855 dark:text-white uppercase tracking-tight flex items-center gap-2.5">
            <ReceiptPercentIcon className="w-8 h-8 text-primary-600 dark:text-primary-450" />
            <span>{language === 'id' ? 'Kepatuhan & Laporan Pajak' : 'Taxation & VAT Ledger'}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-404 text-xs mt-1">
            {language === 'id' 
              ? 'Tinjau kewajiban Pajak Pertambahan Nilai (PPN) Masukan & Keluaran secara otomatis dari rekapitulasi faktur.' 
              : 'Benchmark Input vs Output Value-Added Tax (VAT) generated directly from your invoices records.'}
          </p>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => alert(language === 'id' ? 'Mengekspor laporan e-Faktur...' : 'Exporting e-Tax spreadsheet records...')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl shadow-md transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-white" />
          <span>{language === 'id' ? 'Ekspor e-Faktur' : 'Export e-Tax csv'}</span>
        </button>
      </div>

      {/* 2. STAT CARDS WITH GRADIENT DESIGN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Output VAT Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl -translate-y-4"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {language === 'id' ? 'PPN KELUARAN (Pajak Penjualan)' : 'OUTPUT VAT (TAX ON SALES)'}
            </span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-855 dark:text-white tracking-tight">
            {formatCurrency(outputVat)}
          </h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-1.5 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
            <span>{language === 'id' ? 'Dipungut dari pelanggan' : 'Collected via outbound invoices'}</span>
          </p>
        </div>

        {/* Input VAT Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl -translate-y-4"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {language === 'id' ? 'PPN MASUKAN (Pajak Pembelian)' : 'INPUT VAT (TAX ON PURCHASES)'}
            </span>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-855 dark:text-white tracking-tight">
            {formatCurrency(inputVat)}
          </h3>
          <p className="text-[10.5px] text-emerald-500 font-bold mt-1.5 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{language === 'id' ? 'Bisa dikreditkan' : 'Creditable on purchases billing'}</span>
          </p>
        </div>

        {/* Net VAT Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm relative overflow-hidden">
          {/* Glass background highlight */}
          <div className={`absolute inset-x-0 bottom-0 h-1.5 ${netVat >= 0 ? 'bg-primary-500' : 'bg-emerald-500'}`}></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {netVatLabel}
            </span>
            <Layers className="w-4 h-4 text-primary-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-855 dark:text-white tracking-tight">
            {formatCurrency(Math.abs(netVat))}
          </h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-550 mt-1.5">
            {netVat >= 0 
              ? (language === 'id' ? 'Harus disetor ke kas negara' : 'Net liabilities to state treasury')
              : (language === 'id' ? 'Bisa dikompensasi ke masa pajak berikutnya' : 'Eligible for return reimbursement carryover')
            }
          </p>
        </div>
      </div>

      {/* 3. TAX TRANSACTIONS REGISTRY */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm overflow-hidden">
        <div className="p-5 flex flex-col md:flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700/50 gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-855 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>{t('taxTransactions') || (language === 'id' ? 'Daftar e-Faktur Rekonsiliasi' : 'VAT Reconciliation Registry')}</span>
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">
              {language === 'id' ? 'Menampilkan seluruh dokumen ber-faktur pajak Masukan (AP) dan PPN Keluaran (AR).' : 'Track billing vouchers with associated sales tax factors.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={language === 'id' ? 'Cari No. Faktur / Mitra...' : 'Search Invoice No. / Client...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs text-slate-855 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-450"
              />
            </div>

            {/* Tax Type Filter */}
            <select
              value={taxTypeFilter}
              onChange={(e) => setTaxTypeFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-primary-300"
            >
              <option value="all">{language === 'id' ? 'Semua Tipe' : 'All Tax Types'}</option>
              <option value="Output VAT">Output VAT (Revenue)</option>
              <option value="Input VAT">Input VAT (Expense)</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-405 dark:text-slate-400 font-black uppercase tracking-widest border-b border-slate-105 dark:border-slate-700/50">
              <tr>
                <th className="px-6 py-4">{t('date') || 'Date'}</th>
                <th className="px-6 py-4">{t('documentNo') || 'Document No.'}</th>
                <th className="px-6 py-4">{t('party') || 'Contact Party'}</th>
                <th className="px-6 py-4">{t('taxType') || 'VAT Type'}</th>
                <th className="px-6 py-4 text-right">{t('subtotal') || 'Pre-tax Subtotal'}</th>
                <th className="px-6 py-4 text-right">{t('taxRate') || 'Rate'}</th>
                <th className="px-6 py-5 text-right font-bold text-slate-855 dark:text-white">{t('taxAmount') || 'Tax Collected'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-slate-700 dark:text-slate-300">
              {filteredTaxTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                  <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">{tx.issueDate}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-855 dark:text-slate-200">{tx.invoiceNumber}</td>
                  <td className="px-6 py-4 font-extrabold text-slate-800 dark:text-slate-100">{tx.customer?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      tx.type === 'AR' 
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-300' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tx.type === 'AR' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                      <span>{tx.taxType}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-350">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-500">{tx.vat}%</td>
                  <td className="px-6 py-5 text-right font-black text-slate-855 dark:text-white">{formatCurrency(tx.taxAmount)}</td>
                </tr>
              ))}
              
              {filteredTaxTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                    {language === 'id' ? 'Tidak terdapat faktur pajak yang cocok.' : 'No tax invoices match criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Deck */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTaxTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">
              {language === 'id' ? 'Tidak terdapat faktur pajak yang cocok.' : 'No tax invoices match criteria.'}
            </div>
          ) : (
            filteredTaxTransactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 font-mono font-bold text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                      {tx.invoiceNumber}
                    </span>
                    <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-xs sm:text-sm pt-1 leading-snug">{tx.customer?.name}</h4>
                    <span className="text-[10px] text-slate-400 block pt-0.5">{tx.issueDate}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                    tx.type === 'AR' 
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-300' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-300'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${tx.type === 'AR' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                    <span>{tx.taxType}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-xl text-[10px] leading-relaxed">
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">{t('subtotal') || 'Pre-tax Subtotal'}</span>
                    <span className="font-semibold text-slate-605 dark:text-slate-400 truncate block">{formatCurrency(tx.amount)}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">{t('taxRate') || 'Rate'}</span>
                    <span className="font-bold text-slate-605 dark:text-slate-400 truncate block">{tx.vat}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('taxAmount') || 'Tax Amount'}</span>
                  <span className="text-sm font-black text-slate-855 dark:text-white">
                    {formatCurrency(tx.taxAmount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Tax;
