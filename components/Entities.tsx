import React, { useState } from 'react';
import { useFMS } from '../context/FMSContext';
import { Entity } from '../types';
import { PlusIcon, XMarkIcon } from './icons/IconComponents';
import { Pencil, Trash2, AlertTriangle, HelpCircle, Plus } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';

const Entities: React.FC = () => {
  const { state, dispatch } = useFMS();
  const { language, t } = useLocalization();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active / focused items
  const [focusedEntity, setFocusedEntity] = useState<Entity | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');

  // Submit Add Business Division
  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      alert(t('codeAndNameRequired'));
      return;
    }

    // Check duplicate code
    const isDuplicate = state.entities.some(ent => ent.code.toUpperCase() === code.toUpperCase());
    if (isDuplicate) {
      alert(language === 'id' ? 'Kode entitas ini sudah digunakan!' : 'This entity code is already in use!');
      return;
    }

    dispatch({
      type: 'ADD_ENTITY',
      payload: { code, name, currency }
    });

    setIsAddModalOpen(false);
    setCode('');
    setName('');
  };

  // Open Edit Dialog
  const handleOpenEdit = (it: Entity) => {
    setFocusedEntity(it);
    setCode(it.code);
    setName(it.name);
    setCurrency(it.currency);
    setIsEditModalOpen(true);
  };

  // Submit Edit Entity Change
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedEntity || !code || !name) return;

    dispatch({
      type: 'EDIT_ENTITY',
      payload: {
        id: focusedEntity.id,
        code,
        name,
        currency
      }
    });

    setIsEditModalOpen(false);
    setFocusedEntity(null);
  };

  // Open Delete Warning dialogue
  const handleOpenDelete = (it: Entity) => {
    // Prevent deletion of active entity or last remaining entity
    if (state.entities.length <= 1) {
      alert(language === 'id' ? 'Gagal: Anda tidak boleh menghapus semua entitas bisnis. Minimal harus menyisakan 1!' : 'Error: You must retain at least one default business entity.');
      return;
    }

    setFocusedEntity(it);
    setIsDeleteModalOpen(true);
  };

  // Safe delete confirming
  const confirmDeleteEntity = () => {
    if (!focusedEntity) return;

    dispatch({
      type: 'DELETE_ENTITY',
      payload: focusedEntity.id
    });

    setIsDeleteModalOpen(false);
    setFocusedEntity(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white uppercase tracking-tight flex items-center gap-2.5">
            <span>{t('businessEntities')}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {language === 'id' 
              ? 'Kelola entitas bisnis, cabang usaha, anak perusahaan atau divisi akunting terpisah Anda.' 
              : 'Add separate subsidiaries, legal ventures, branches, and monitor individual finance logs.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCode(`DIV-${Math.floor(Math.random() * 90 + 10)}`);
            setName('');
            setCurrency('IDR');
            setIsAddModalOpen(true);
          }}
          className="whitespace-nowrap flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider py-3 px-4 rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>{t('addNewEntity')}</span>
        </button>
      </div>

      {/* 2. ENTITIES LISTING TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-850 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-405 dark:text-slate-400 font-black uppercase tracking-widest border-b border-slate-105 dark:border-slate-700/50">
              <tr>
                <th className="px-6 py-4">{t('code')}</th>
                <th className="px-6 py-4">{t('entityName')}</th>
                <th className="px-6 py-4">{t('baseCurrency')}</th>
                <th className="px-6 py-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-700 dark:text-slate-300">
              {state.entities.map((ent) => (
                <tr key={ent.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition duration-200">
                  <td className="px-6 py-4 font-mono font-bold text-slate-500 dark:text-slate-455">{ent.code}</td>
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-slate-850 dark:text-slate-100">{ent.name}</div>
                    {state.activeEntity === ent.id && (
                      <span className="text-[9px] bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-305 px-1.5 py-0.5 rounded font-black uppercase tracking-wider mt-1 inline-block">
                        {language === 'id' ? 'Aktif Saat Ini' : 'Current active'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black px-2.5 py-1 rounded">
                      {ent.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ent)}
                        title={language === 'id' ? 'Ubah' : 'Edit'}
                        className="p-1 px-1.5 text-slate-400 hover:text-indigo-550 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(ent)}
                        title={language === 'id' ? 'Hapus' : 'Delete'}
                        className="p-1 px-1.5 text-slate-400 hover:text-rose-550 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer"
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

        {/* Mobile View Card Deck */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {state.entities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold">
              {language === 'id' ? 'Divisi/Entitas tidak ditemukan' : 'No corporate divisions found.'}
            </div>
          ) : (
            state.entities.map((ent) => (
              <div key={ent.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 font-mono font-bold text-slate-600 dark:text-slate-455 px-1.5 py-0.5 rounded">
                      {ent.code}
                    </span>
                    <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-xs sm:text-sm pt-1 leading-snug">{ent.name}</h4>
                    {state.activeEntity === ent.id && (
                      <span className="text-[9px] bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider inline-block">
                        {language === 'id' ? 'Aktif Saat Ini' : 'Current active'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ent)}
                      title={language === 'id' ? 'Ubah' : 'Edit'}
                      className="p-1.5 text-slate-400 hover:text-indigo-550 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-900 transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(ent)}
                      title={language === 'id' ? 'Hapus' : 'Delete'}
                      className="p-1.5 text-slate-400 hover:text-rose-550 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-900 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('baseCurrency')}</span>
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black px-2.5 py-1 rounded">
                    {ent.currency}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. ADD ENTITY POPUP FORM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-905/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-705 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800 dark:text-white animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base font-black uppercase tracking-wider">
                {t('addNewEntity')}
              </h3>
            </div>

            <form onSubmit={handleAddNewSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  {t('code')}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={t('eg_bc') || 'DIV-99'}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  {t('entityName')}
                </label>
                <input 
                  type="text" 
                  required
                  placeholder={t('eg_bellcorp') || 'Bellcorp branch'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  {t('baseCurrency')}
                </label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                >
                  <option value="IDR">IDR (Rupiah)</option>
                  <option value="USD">USD (United States Dollar)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-755 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-205 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-750 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Simpan Entitas' : 'Register Corporate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT ENTITY POPUP FORM */}
      {isEditModalOpen && focusedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-905/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-705 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-slate-800 dark:text-white animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-base font-black uppercase tracking-wider">
                {language === 'id' ? 'Ubah Profil Entitas' : 'Adjust Affiliate profile'}
              </h3>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  {t('code')}
                </label>
                <input 
                  type="text" 
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  {t('entityName')}
                </label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  {t('baseCurrency')}
                </label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-755 text-slate-655 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-205 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'id' ? 'Simpan' : 'Update details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE DIVISION WARNING MODAL */}
      {isDeleteModalOpen && focusedEntity && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-910/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-center text-slate-800 dark:text-white animate-in zoom-in-95 duration-250">
            
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-955/20 rounded-full flex items-center justify-center text-rose-550 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black tracking-tight leading-snug">
              {language === 'id' ? 'Hapus Entitas Bisnis?' : 'Delete Business Division?'}
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === 'id' 
                ? `Apakah anda yakin ingin menghapus divisi/cabang ${focusedEntity.name} (${focusedEntity.code})? Akun dan pencatatan buku besar terkait cabang ini tidak dapat kembali.`
                : `Are you sure you want to permanently detach entity affiliate ${focusedEntity.name} (${focusedEntity.code})?`}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-600 dark:text-slate-355 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={confirmDeleteEntity}
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

export default Entities;
