import React, { useState } from 'react';
import { COAAccount } from '../types';
import { useFMS } from '../context/FMSContext';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';

const ChartOfAccounts: React.FC = () => {
  const { state, dispatch } = useFMS();
  const { language, t } = useLocalization();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Focus account states
  const [editingAccount, setEditingAccount] = useState<COAAccount | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Asset' as COAAccount['type'],
    description: '',
    parentAccountId: '',
    openingBalance: 0
  });

  const handleOpenAdd = () => {
    setFormData({
      code: '',
      name: '',
      type: 'Asset',
      description: '',
      parentAccountId: '',
      openingBalance: 0
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (account: COAAccount) => {
    setEditingAccount(account);
    setFormData({
      code: account.code,
      name: account.name,
      type: account.type,
      description: account.description || '',
      parentAccountId: account.parentAccountId || '',
      openingBalance: account.openingBalance || 0
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (accountId: string) => {
    setDeleteAccountId(accountId);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert(t('codeAndNameRequired') || 'Code and Name are required');
      return;
    }
    const uid = 'COA-' + Date.now();
    dispatch({ 
      type: 'ADD_COA_ACCOUNT', 
      payload: { ...formData, id: uid } 
    });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!formData.code || !formData.name) {
      alert(t('codeAndNameRequired') || 'Code and Name are required');
      return;
    }
    dispatch({
      type: 'EDIT_COA_ACCOUNT',
      payload: { 
        ...editingAccount, 
        code: formData.code,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        parentAccountId: formData.parentAccountId,
        openingBalance: formData.openingBalance
      }
    });
    setIsEditModalOpen(false);
    setEditingAccount(null);
  };

  const confirmDelete = () => {
    if (deleteAccountId) {
      dispatch({ type: 'DELETE_COA_ACCOUNT', payload: deleteAccountId });
      setIsDeleteConfirmOpen(false);
      setDeleteAccountId(null);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Upper header action block */}
      <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-700/40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">{t('chartofaccounts')}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'en' ? 'Manage your corporate Chart of Accounts ledger structures' : 'Kelola struktur hierarki bagan nama akun keuangan perusahaan Anda'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition duration-150 shadow-sm transform active:scale-98"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('addNewAccount')}
          </button>
        </div>

        {/* Table representation */}
        <div className="mt-6 hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50">
              <tr>
                <th scope="col" className="px-5 py-3.5">{t('code')}</th>
                <th scope="col" className="px-5 py-3.5">{t('accountName')}</th>
                <th scope="col" className="px-5 py-3.5">{t('description')}</th>
                <th scope="col" className="px-5 py-3.5">{t('type')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{language === 'en' ? 'Opening Balance' : 'Saldo Awal'}</th>
                <th scope="col" className="px-5 py-3.5 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {state.coa.map((account) => (
                <tr 
                  key={account.id} 
                  className="group bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-xs font-medium text-slate-600 dark:text-slate-350">{account.code}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{account.name}</td>
                  <td className="px-5 py-4 text-xs text-slate-400 dark:text-slate-500 max-w-xs truncate">{account.description || '-'}</td>
                  <td className="px-5 py-4 text-xs">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {t(account.type.toLowerCase())}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-right font-semibold text-slate-600 dark:text-slate-400">
                    {new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
                      style: 'currency',
                      currency: state.currency,
                      maximumFractionDigits: 0
                    }).format(account.openingBalance || 0)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        title={language === 'en' ? 'Edit' : 'Ubah'}
                        onClick={() => handleOpenEdit(account)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title={language === 'en' ? 'Delete' : 'Hapus'}
                        onClick={() => handleOpenDelete(account.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards stack view */}
        <div className="mt-6 block md:hidden space-y-4">
          {state.coa.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-405 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl">
              {language === 'en' ? 'No accounts found.' : 'Tidak ada akun ditemukan.'}
            </div>
          ) : (
            state.coa.map((account) => (
              <div 
                key={account.id} 
                className="p-4 bg-slate-50/50 dark:bg-slate-700/10 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 block">{account.code}</span>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{account.name}</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-3.50 rounded text-[10px] font-bold uppercase tracking-wider">
                    {t(account.type.toLowerCase())}
                  </span>
                </div>

                {account.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {account.description}
                  </p>
                )}

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">{language === 'en' ? 'Opening' : 'Saldo Awal'}</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5 block">
                      {new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
                        style: 'currency',
                        currency: state.currency,
                        maximumFractionDigits: 0
                      }).format(account.openingBalance || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      title={language === 'en' ? 'Edit' : 'Ubah'}
                      onClick={() => handleOpenEdit(account)}
                      className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      title={language === 'en' ? 'Delete' : 'Hapus'}
                      onClick={() => handleOpenDelete(account.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 sm:rounded-3xl rounded-2xl shadow-2xl w-full max-w-lg border border-slate-150 dark:border-slate-700/60 transition-all transform scale-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/40">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                {isAddModalOpen ? (language === 'en' ? 'Add New COA Account' : 'Tambah Akun COA Baru') : (language === 'en' ? 'Edit COA Account' : 'Ubah Akun COA')}
              </h3>
              <button 
                type="button"
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} 
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-705 text-slate-400 dark:text-slate-500 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={isAddModalOpen ? handleSaveAdd : handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('code')} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder={t('eg_1003') || 'e.g., 1003'} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('name')} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder={t('eg_bank_mandiri') || 'e.g., Bank Trust'} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('description')}
                </label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  rows={2} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder={t('eg_main_operating_account_desc') || 'Secondary description ...'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('type')}
                  </label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as COAAccount['type']})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Asset">{t('asset') || 'Asset'}</option>
                    <option value="Liability">{t('liability') || 'Liability'}</option>
                    <option value="Equity">{t('equity') || 'Equity'}</option>
                    <option value="Revenue">{t('revenue') || 'Revenue'}</option>
                    <option value="Expense">{t('expense') || 'Expense'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('parentAccount')}
                  </label>
                  <select 
                    value={formData.parentAccountId} 
                    onChange={e => setFormData({...formData, parentAccountId: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('none_top_level') || 'None (Top Level)'}</option>
                    {state.coa
                      .filter(acc => !editingAccount || acc.id !== editingAccount.id)
                      .map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Opening Balance' : 'Saldo Awal'}
                </label>
                <input 
                  type="number" 
                  value={formData.openingBalance} 
                  onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder="0" 
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700/40 gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} 
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:text-slate-350 dark:hover:text-white transition"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-2xl text-xs font-bold transition"
                >
                  {isAddModalOpen ? (language === 'en' ? 'Add Account' : 'Tambah Akun') : (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-150 dark:border-slate-700/50 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
                {language === 'en' ? 'Delete Account' : 'Hapus Akun COA'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Are you sure you want to delete this Chart of Account structure? Associated transactions on this account may become unlinked.'
                  : 'Apakah Anda yakin ingin menghapus struktur bagan akun ini? Transaksi yang terkait dengan akun ini berpotensi kehilangan tautan.'}
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-350 hover:bg-slate-105 dark:hover:bg-slate-700 hover:text-slate-700 transition"
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

export default ChartOfAccounts;
