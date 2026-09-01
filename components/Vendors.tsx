import React, { useState } from 'react';
import { Vendor } from '../types';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';
import { useFMS } from '../context/FMSContext';

const Vendors: React.FC = () => {
  const { language, t } = useLocalization();
  const { state, dispatch } = useFMS();

  // Overlay Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Focus Vendor state
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    outstandingBalance: '',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      outstandingBalance: '0',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      outstandingBalance: String(vendor.outstandingBalance || 0),
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert(language === 'en' ? 'Vendor name is required' : 'Nama Vendor wajib diisi');
      return;
    }

    const payload = {
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      outstandingBalance: Number(formData.outstandingBalance || 0),
    };

    dispatch({ type: 'ADD_VENDOR', payload });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    if (!formData.name) {
      alert(language === 'en' ? 'Vendor name is required' : 'Nama Vendor wajib diisi');
      return;
    }

    const payload = {
      ...editingVendor,
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      outstandingBalance: Number(formData.outstandingBalance || 0),
    };

    dispatch({ type: 'EDIT_VENDOR', payload });
    setIsEditModalOpen(false);
    setEditingVendor(null);
  };

  const confirmDelete = () => {
    if (isDeleteConfirmOpen) {
      dispatch({ type: 'DELETE_VENDOR', payload: isDeleteConfirmOpen });
      setIsDeleteConfirmOpen(null);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Main card box */}
      <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-700/40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">{t('vendorManagement')}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'en' ? 'Manage, record, and configure corporate procurement external Vendor records' : 'Kelola, catat, dan konfigurasikan profil data Vendor eksternal pengadaan perusahaan'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition transform active:scale-98 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('newVendor')}
          </button>
        </div>

        {/* Vendors responsive data list Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50">
              <tr>
                <th scope="col" className="px-5 py-3.5">{t('vendorName')}</th>
                <th scope="col" className="px-5 py-3.5">{t('contact')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{t('outstandingBalance')}</th>
                <th scope="col" className="px-5 py-3.5 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {state.vendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-xs text-slate-400">
                    {language === 'en' ? 'No vendors found. Click New Vendor to start' : 'Tidak ada vendor ditemukan. Klik Vendor Baru untuk memulai'}
                  </td>
                </tr>
              ) : (
                state.vendors.map((vendor) => (
                  <tr 
                    key={vendor.id} 
                    className="group bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                       {vendor.name}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <p className="font-bold text-slate-700 dark:text-slate-300">{vendor.contactPerson || '-'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{vendor.email} {vendor.phone ? `| ${vendor.phone}` : ''}</p>
                    </td>
                    <td className={`px-5 py-4 text-right text-xs font-bold ${vendor.outstandingBalance > 0 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}`}>
                      {formatCurrency(vendor.outstandingBalance)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          title={language === 'en' ? 'Edit' : 'Ubah'}
                          onClick={() => handleOpenEdit(vendor)}
                          className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title={language === 'en' ? 'Delete' : 'Hapus'}
                          onClick={() => setIsDeleteConfirmOpen(vendor.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-405 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards stack view */}
        <div className="block md:hidden space-y-4">
          {state.vendors.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-405 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl">
              {language === 'en' ? 'No vendors found. Click New Vendor to start' : 'Tidak ada vendor ditemukan. Klik Vendor Baru untuk memulai'}
            </div>
          ) : (
            state.vendors.map((vendor) => (
              <div 
                key={vendor.id} 
                className="p-4 bg-slate-50/50 dark:bg-slate-705/10 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-tight">{vendor.name}</h4>
                    {vendor.contactPerson && (
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mt-1">
                        {vendor.contactPerson}
                      </span>
                    )}
                  </div>
                </div>

                {(vendor.email || vendor.phone) && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 space-y-0.5 bg-white dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 leading-normal">
                    {vendor.email && <p className="truncate">Email: {vendor.email}</p>}
                    {vendor.phone && <p>Tlp/Wa: {vendor.phone}</p>}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black block">{t('outstandingBalance')}</span>
                    <span className={`text-xs font-black block mt-1 ${vendor.outstandingBalance > 0 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}`}>
                      {formatCurrency(vendor.outstandingBalance)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title={language === 'en' ? 'Edit' : 'Ubah'}
                      onClick={() => handleOpenEdit(vendor)}
                      className="p-2 text-slate-405 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title={language === 'en' ? 'Delete' : 'Hapus'}
                      onClick={() => setIsDeleteConfirmOpen(vendor.id)}
                      className="p-2 text-slate-405 hover:text-rose-505 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* Add / Edit Vendor Modal Overlay */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 sm:rounded-3xl rounded-2xl shadow-2xl w-full max-w-lg border border-slate-150 dark:border-slate-700/60 transition-all transform scale-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/40">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                {isAddModalOpen ? (language === 'en' ? 'Register New Vendor' : 'Daftarkan Vendor Baru') : (language === 'en' ? 'Edit Vendor Profile' : 'Ubah Profil Vendor')}
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
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === 'en' ? 'Vendor Name' : 'Nama Perusahaan Vendor'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  placeholder={language === 'en' ? 'e.g., SpaceX' : 'misal, SpaceX'} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'en' ? 'Contact Person' : 'Klien Kontak'}
                  </label>
                  <input 
                    type="text" 
                    value={formData.contactPerson} 
                    onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="John Doe" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'en' ? 'Outstanding Balance' : 'Saldo Hutang Awal'}
                  </label>
                  <input 
                    type="number" 
                    value={formData.outstandingBalance} 
                    onChange={e => setFormData({...formData, outstandingBalance: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="0" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="billing@spacex.com" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="+1 555 123 4567" 
                  />
                </div>
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
                  {isAddModalOpen ? (language === 'en' ? 'Add Vendor' : 'Tambah Vendor') : (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-150 dark:border-slate-700/50 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-800 dark:text-white">
                {language === 'en' ? 'Delete Vendor Profile' : 'Hapus Vendor'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Are you absolutely sure you want to permanently delete this Vendor database profile? Active purchase bills for this vendor will remain recorded.'
                  : 'Apakah Anda yakin ingin menghapus profil vendor ini secara permanen? Tagihan pembelian yang aktif untuk vendor ini akan tetap tercatat.'}
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setIsDeleteConfirmOpen(null)}
                className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 transition"
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

export default Vendors;
