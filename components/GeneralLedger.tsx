import React, { useMemo, useState } from 'react';
import { JournalEntry, Transaction } from '../types';
import { Plus, Trash, X, HelpCircle, Edit } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';
import { useFMS } from '../context/FMSContext';

const GeneralLedger: React.FC = () => {
  const { language, t } = useLocalization();
  const { state, dispatch, createTransactionApi, deleteTransactionApi } = useFMS();

  // Dialog overlays state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Sales',
    dr: '',
    cr: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    const defaultDr = state.coa.find(a => a.type === 'Asset')?.code || '';
    const defaultCr = state.coa.find(a => a.type === 'Revenue')?.code || '';
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Sales',
      dr: defaultDr,
      cr: defaultCr,
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveJE = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.dr || !formData.cr) {
      alert(language === 'en' ? 'Please fill in all required fields' : 'Silakan isi semua bidang yang diperlukan');
      return;
    }

    const payload = {
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      type: 'expense' as const, // standard double entry debit/credit defaults to expense for ledger flow mapping
      category: formData.category,
      status: 'Completed' as const,
      dr: formData.dr,
      cr: formData.cr,
      notes: formData.notes,
      cur: state.currency,
      entity: state.activeEntity,
    };

    await createTransactionApi(payload);
    setIsAddModalOpen(false);
  };

  const handleDeleteClick = (txId: string) => {
    setIsDeleteConfirmOpen(txId);
  };

  const confirmDelete = async () => {
    if (isDeleteConfirmOpen) {
      await deleteTransactionApi(isDeleteConfirmOpen);
      setIsDeleteConfirmOpen(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const journalEntries: JournalEntry[] = useMemo(() => {
    return state.transactions.map((tx, index) => {
      const drAccount = state.coa.find(acc => acc.code === tx.dr)?.name || tx.dr;
      const crAccount = state.coa.find(acc => acc.code === tx.cr)?.name || tx.cr;
      const amount = Math.abs(tx.amount);

      return {
        id: tx.id,
        entryNumber: `JE-${String(index + 1).padStart(4, '0')}`,
        date: tx.date,
        description: tx.description,
        lines: [
          { accountName: `${tx.dr} - ${drAccount}`, debit: amount },
          { accountName: `${tx.cr} - ${crAccount}`, credit: amount },
        ],
      };
    });
  }, [state.transactions, state.coa]);

  return (
    <div className="container mx-auto space-y-6">
      {/* GL Container Board and Header */}
      <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-700/40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">{t('generalJournal')}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'en' ? 'Review chronological debit and credit transaction journal double-entries' : 'Tinjau jurnal entri ganda transaksi debit dan kredit kronologis'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition transform active:scale-98 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('addNewJournalEntry')}
          </button>
        </div>

        {/* Chronological Table of Entries */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50">
              <tr>
                <th scope="col" className="px-5 py-3.5 w-28">{t('date')}</th>
                <th scope="col" className="px-5 py-3.5 w-32">{t('entry')} #</th>
                <th scope="col" className="px-5 py-3.5">{t('description')}</th>
                <th scope="col" className="px-5 py-3.5">{t('account')}</th>
                <th scope="col" className="px-5 py-3.5 text-right w-36">{t('debit')}</th>
                <th scope="col" className="px-5 py-3.5 text-right w-36">{t('credit')}</th>
                <th scope="col" className="px-5 py-3.5 text-center w-24">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    {language === 'en' ? 'No journal entries found. Begin by adding a journal entry.' : 'Tidak ada entri jurnal ditemukan. Mulai dengan membuat entri baru.'}
                  </td>
                </tr>
              ) : (
                journalEntries.map((entry) => (
                  <React.Fragment key={entry.id}>
                    {/* Header line for each Entry block */}
                    <tr className="bg-slate-50/40 dark:bg-slate-750/10 border-t border-slate-100 dark:border-slate-700/30">
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium">{entry.date}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-primary-600 dark:text-primary-400">{entry.entryNumber}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white text-xs" colSpan={4}>
                        {entry.description}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          title={language === 'en' ? 'Delete' : 'Hapus'}
                          onClick={() => handleDeleteClick(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                    {/* Items loops */}
                    {entry.lines.map((line, index) => (
                      <tr 
                        key={index} 
                        className="bg-transparent hover:bg-slate-50/30 dark:hover:bg-slate-800/20 text-xs"
                      >
                        <td colSpan={3} className="px-5 py-3 border-b border-dashed border-slate-100 dark:border-slate-700/20"></td>
                        <td className={`px-5 py-3 font-semibold text-slate-600 dark:text-slate-300 border-b border-dashed border-slate-100 dark:border-slate-700/20 ${line.credit ? 'pl-8 text-slate-500 dark:text-slate-400' : ''}`}>
                          {line.accountName}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-100 dark:border-slate-700/20">
                          {line.debit ? formatCurrency(line.debit) : '-'}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-100 dark:border-slate-700/20">
                          {line.credit ? formatCurrency(line.credit) : '-'}
                        </td>
                        <td className="px-5 py-3 border-b border-dashed border-slate-100 dark:border-slate-700/20"></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards stack view */}
        <div className="block md:hidden space-y-4">
          {journalEntries.length === 0 ? (
            <div className="text-center py-12 text-slate-405 text-xs bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl">
              {language === 'en' ? 'No journal entries found. Begin by adding a journal entry.' : 'Tidak ada entri jurnal ditemukan. Mulai dengan membuat entri baru.'}
            </div>
          ) : (
            journalEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="p-4 bg-slate-50/50 dark:bg-slate-700/10 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col space-y-3"
              >
                <div className="flex justify-between items-center bg-slate-105 dark:bg-slate-800/40 p-2.5 rounded-xl text-xs">
                  <span className="font-bold text-slate-400 dark:text-slate-500">{entry.date}</span>
                  <span className="font-mono font-black text-primary-600 dark:text-primary-400">{entry.entryNumber}</span>
                </div>

                <div className="text-sm font-extrabold text-slate-800 dark:text-white px-1">
                  {entry.description}
                </div>

                {/* Ledger Lines */}
                <div className="space-y-2 pt-1">
                  {entry.lines.map((line, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-start text-xs p-2.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/60 ${line.credit ? 'border-l-4 border-l-rose-500 pl-4' : 'border-l-4 border-l-emerald-500 pl-4'}`}
                    >
                      <div className="max-w-[65%]">
                        <span className="text-[10px] text-slate-400 font-bold block mb-0.5">{line.credit ? t('credit') : t('debit')}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 leading-relaxed block">{line.accountName}</span>
                      </div>
                      <div className="text-right whitespace-nowrap font-bold text-slate-800 dark:text-slate-200">
                        {line.debit ? formatCurrency(line.debit) : formatCurrency(line.credit || 0)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/55">
                  <button
                    type="button"
                    title={language === 'en' ? 'Delete' : 'Hapus'}
                    onClick={() => handleDeleteClick(entry.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Journal Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 sm:rounded-3xl rounded-2xl shadow-2xl w-full max-w-lg border border-slate-150 dark:border-slate-700/60 transition-all transform scale-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/40">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                {language === 'en' ? 'Add New Journal Entry' : 'Tambah Jurnal Entri Baru'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-705 text-slate-400 dark:text-slate-500 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveJE} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Description' : 'Deskripsi'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder={language === 'en' ? 'e.g., Office Rent Payment' : 'misal, Pembayaran Sewa Kantor'} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'en' ? 'Amount (Debit & Credit Value)' : 'Nilai Jumlah'} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="0" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'en' ? 'Date' : 'Tanggal'}
                  </label>
                  <input 
                    type="date"
                    required
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'en' ? 'Debit Account (DR)' : 'Akun Debit (DR)'} <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required
                    value={formData.dr} 
                    onChange={e => setFormData({...formData, dr: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{language === 'en' ? '-- Select Debit --' : '-- Pilih Debit --'}</option>
                    {state.coa.map(acc => (
                      <option key={acc.id} value={acc.code}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'en' ? 'Credit Account (CR)' : 'Akun Kredit (CR)'} <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required
                    value={formData.cr} 
                    onChange={e => setFormData({...formData, cr: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{language === 'en' ? '-- Select Credit --' : '-- Pilih Kredit --'}</option>
                    {state.coa.map(acc => (
                      <option key={acc.id} value={acc.code}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700/40 gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)} 
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:text-slate-350 dark:hover:text-white transition"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-2xl text-xs font-bold transition"
                >
                  {language === 'en' ? 'Record Entry' : 'Catat Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-150 dark:border-slate-700/50 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6 text-rose-600 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
                {language === 'en' ? 'Confirm Deletion' : 'Konfirmasi Hapus Jurnal'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Are you sure you want to delete this General Journal double-entry and correct the corporate ledger balances?'
                  : 'Apakah Anda yakin ingin menghapus double-entry Jurnal Umum ini dan mengoreksi saldo buku besar perusahaan?'}
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setIsDeleteConfirmOpen(null)}
                className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 transition"
              >
                {t('cancel')}
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition"
              >
                {language === 'en' ? 'Delete' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;
