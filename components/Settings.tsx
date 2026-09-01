import React, { useState } from 'react';
import { useFMS, DEFAULT_STATE } from '../context/FMSContext';
import { FMSModules, FMSState } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { useTheme } from '../hooks/useTheme';
import { 
  Sliders, Shield, Globe, Sun, Moon, Trash2, RotateCcw, 
  Download, FileJson, FileSpreadsheet, Check, AlertTriangle, X 
} from 'lucide-react';

const Settings: React.FC = () => {
  const { state, dispatch } = useFMS();
  const { language, toggleLanguage, t } = useLocalization();
  const { theme, toggleTheme } = useTheme();

  const isAdmin = state.role === 'Admin' || state.role === 'admin';

  // Toggle module visibility (only for Admin)
  const handleToggleModule = (key: string, value: boolean) => {
    dispatch({ type: 'TOGGLE_MODULE', payload: { key, value } });
  };

  const handleToggleAllModules = (value: boolean) => {
    moduleKeys.forEach((key) => {
      if (key !== 'dashboard' && key !== 'settings') {
        dispatch({ type: 'TOGGLE_MODULE', payload: { key, value } });
      }
    });
    triggerToast(
      language === 'id' 
        ? `Semua modul berhasil dipasangkan ke ${value ? 'Aktif' : 'Non-aktif'}!` 
        : `All modifiable modules successfully set to ${value ? 'ACTIVE' : 'INACTIVE'}!`
    );
  };

  const moduleKeys: (keyof FMSModules)[] = [
    "dashboard", "transactions", "invoices", "cashbank",
    "budgeting", "tax", "assets", "inventory", "coa",
    "entities", "users", "settings"
  ];
  
  const moduleTranslationKeys: Record<keyof FMSModules, string> = {
    dashboard: "dashboard",
    transactions: "generalledger",
    invoices: "salesAndPurchases",
    cashbank: "cashAndBank",
    budgeting: "budgeting",
    tax: "tax",
    assets: "assets",
    inventory: "inventory",
    coa: "chartofaccounts",
    entities: "entities",
    users: "users",
    settings: "settings",
  };

  // Popup modal system states
  const [activeModal, setActiveModal] = useState<'none' | 'reset' | 'restore' | 'backup_csv' | 'backup_json'>('none');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // 1. Data Reset: Wipes all ledger data except users/accounts profile
  const handleResetData = () => {
    const clearedState: FMSState = {
      ...state,
      coa: [],
      transactions: [],
      invoices: [],
      budgets: [],
      assets: [],
      inventory: [],
      projects: [],
      vendors: [],
      payrollRuns: [],
      entities: [],
      // Active entities & subscription should remain
      activeEntity: 'E1',
      activePeriod: new Date().toISOString().slice(0, 7)
    };

    dispatch({ type: 'SET_STATE', payload: clearedState });
    setActiveModal('none');
    triggerToast(
      language === 'id' 
        ? 'Semua data transaksi & ledger berhasil direset!' 
        : 'All transaction and ledger data has been successfully reset!'
    );
  };

  // 2. Data Restore: Restores user-specific original seeded states / syncs from API
  const handleRestoreData = () => {
    const emailKey = state.currentUserEmail || 'demo@finagrow.com';
    const roleKey = state.role || 'Admin';
    
    // We retain profile identity and restore state
    const restoredState: FMSState = {
      ...DEFAULT_STATE,
      currentUserEmail: emailKey,
      role: roleKey,
      subscription: state.subscription || 'Free',
      users: state.users && state.users.length > 0 ? state.users : DEFAULT_STATE.users
    };

    dispatch({ type: 'SET_STATE', payload: restoredState });
    setActiveModal('none');
    triggerToast(
      language === 'id' 
        ? 'Data berhasil dipulihkan & disinkronkan ke server!' 
        : 'Data successfully restored and synchronized!'
    );
  };

  // 3. Backup as JSON
  const handleBackupJSON = () => {
    try {
      const backupData = {
        coa: state.coa,
        transactions: state.transactions,
        invoices: state.invoices,
        budgets: state.budgets,
        assets: state.assets,
        inventory: state.inventory,
        projects: state.projects,
        vendors: state.vendors,
        payrollRuns: state.payrollRuns,
        modules: state.modules,
        entities: state.entities
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `FMS_Backup_${state.currentUserEmail || 'user'}_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setActiveModal('none');
      triggerToast(
        language === 'id' 
          ? 'Backup JSON berhasil diunduh!' 
          : 'JSON backup downloaded successfully!'
      );
    } catch (_) {
      triggerToast('Error generating JSON backup');
    }
  };

  // 4. Backup as CSV
  const handleBackupCSV = () => {
    try {
      let csvContent = 'Type,ID,Date,Description,Debit Account (Dr),Credit Account (Cr),Amount,Currency,Category,Status,Party\n';
      
      const transactionsToExport = state.transactions || [];
      transactionsToExport.forEach((tx) => {
        const party = tx.customer || tx.vendor || '-';
        const cleanDesc = (tx.description || '').replace(/"/g, '""');
        const cleanParty = party.replace(/"/g, '""');
        const row = [
          tx.type || 'transaction',
          tx.id,
          tx.date,
          `"${cleanDesc}"`,
          tx.dr || '',
          tx.cr || '',
          tx.amount,
          tx.cur || 'IDR',
          tx.category || '-',
          tx.status || '-',
          `"${cleanParty}"`
        ].join(',');
        csvContent += row + '\n';
      });

      const csvDataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', csvDataUri);
      downloadAnchor.setAttribute('download', `FMS_Transactions_${state.currentUserEmail || 'user'}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setActiveModal('none');
      triggerToast(
        language === 'id' 
          ? 'Backup CSV Transaksi berhasil diunduh!' 
          : 'Transaction CSV backup downloaded successfully!'
      );
    } catch (_) {
      triggerToast('Error generating CSV backup');
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 relative pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-emerald-600 dark:bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce border border-emerald-500">
          <Check className="w-4 h-4 text-white" />
          <span className="text-xs font-bold font-sans">{toastMessage}</span>
        </div>
      )}

      {/* Settings Grid Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Localization & Aesthetics Block */}
        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 dark:bg-sky-950/40 text-sky-650 rounded-2xl">
              <Globe className="w-5 h-5 dark:text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                {language === 'id' ? 'Bahasa & Personalisasi' : 'Language & Personalization'}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {language === 'id' ? 'Kelola bahasa sistem dan tampilan tema FINAGROW' : 'Adjust ledger translation and interface dark/light theme'}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-5 space-y-5">
            {/* Language Switcher */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'id' ? 'Bahasa Aplikasi' : 'System Language'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {language === 'id' ? 'ID (Bahasa Indonesia) / EN (English)' : 'Active locale translation dictionary'}
                </span>
              </div>
              
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-700/50">
                <button
                  onClick={() => { if (language !== 'en') toggleLanguage(); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    language === 'en' 
                      ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => { if (language !== 'id') toggleLanguage(); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    language === 'id' 
                      ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  ID
                </button>
              </div>
            </div>

            {/* Light/Dark Toggler */}
            <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/30 pt-4">
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {language === 'id' ? 'Mode Tampilan' : 'Appearance Theme'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {language === 'id' ? 'Beralih antara Terang dan Gelap' : 'Switch adaptive dark eye-care lighting interface'}
                </span>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-205 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 transition-all"
              >
                {theme === 'dark' ? (
                  <>
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold dark:text-white">Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold dark:text-white">Light Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Disaster Recovery, Seed & Backups Block */}
        <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 text-rose-650 rounded-2xl">
              <Trash2 className="w-5 h-5 dark:text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                {language === 'id' ? 'Manajemen Data & Backup' : 'Data Maintenance & Backups'}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {language === 'id' ? 'Cadangkan, pulihkan, atau setel ulang basis data ledger' : 'Export reports in JSON/CSV, restore profiles, or clear state database'}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/50 pt-5 space-y-3.5">
            {/* Backup Box */}
            <div className="flex flex-col gap-2.5 bg-slate-55/60 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-800/40 rounded-2xl">
              <span className="text-xs font-bold text-slate-750 dark:text-slate-200 block">
                {language === 'id' ? 'Ekspor Backup Cadangan' : 'Export System Backup'}
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => setActiveModal('backup_json')}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-305 border border-indigo-100/60 dark:border-indigo-900/50 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  JSON BACKUP
                </button>
                <button
                  onClick={() => setActiveModal('backup_csv')}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-305 border border-emerald-100/60 dark:border-emerald-900/50 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  TRANSACTIONS CSV
                </button>
              </div>
            </div>

            {/* Reset & Restore Actions */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-slate-50 dark:border-slate-800/30 pt-4">
              <button
                onClick={() => setActiveModal('restore')}
                className="px-4 py-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-900/65 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'id' ? 'Restore Data' : 'Restore Seed'}
              </button>

              <button
                onClick={() => setActiveModal('reset')}
                className="px-4 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/65 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {language === 'id' ? 'Reset Semua Data' : 'Reset All Ledger'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Module Manager Section */}
      <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-sm mt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-650 rounded-2xl">
              <Sliders className="w-5 h-5 dark:text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('moduleManager')}</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                {language === 'en' ? 'Manage active operational FINAGROW system components' : 'Kelola komponen operasional aktif sistem FINAGROW'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleAllModules(true)}
                className="cursor-pointer bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-black transition-all border border-emerald-200/50 dark:border-emerald-800/50"
              >
                {language === 'id' ? '✓ Aktifkan Semua' : '✓ Enable All'}
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllModules(false)}
                className="cursor-pointer bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-xl text-xs font-black transition-all border border-rose-200/50 dark:border-rose-800/50"
              >
                {language === 'id' ? '✗ Nonaktifkan Semua' : '✗ Disable All'}
              </button>
            </div>
          )}
        </div>

        {!isAdmin ? (
           // Restricted message inside Settings if user is not Admin
           <div className="p-8 border border-dashed border-slate-250 dark:border-slate-750 rounded-2xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/10">
             <Shield className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
             <div>
               <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                 {language === 'en' ? 'Administrative Access Required' : 'Akses Administrator Diperlukan'}
               </h4>
               <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-normal mt-1">
                 {language === 'en' 
                    ? 'Structural module toggling is reserved for corporate owners and primary administrators only. Current profile is Standard User.'
                    : 'Pengaturan aktif modul FINAGROW hanya diperbolehkan untuk pemilik korporasi atau administrator utama. Profil Anda saat ini adalah Standard User.'}
               </p>
             </div>
           </div>
        ) : (
           // Render actual module settings togglers to Administrator
           <div className="space-y-4">
             <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
               {t('moduleManagerDesc')}
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {moduleKeys.map((key) => {
                 const isStatic = key === 'dashboard' || key === 'settings';
                 return (
                   <div key={key} className="flex items-center justify-between bg-slate-50/40 dark:bg-slate-950/20 p-4 border border-slate-100/30 dark:border-slate-800/25 rounded-2xl">
                     <span className="font-bold text-slate-705 dark:text-slate-300 text-xs">{t(moduleTranslationKeys[key])}</span>
                     <div className="flex gap-2">
                       <button
                         type="button"
                         disabled={isStatic}
                         onClick={() => handleToggleModule(key as string, true)}
                         className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                           state.modules[key]
                             ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm'
                             : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-905 dark:hover:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                         } ${isStatic ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
                       >
                         {language === 'id' ? 'Aktif' : 'Enable'}
                       </button>
                       <button
                         type="button"
                         disabled={isStatic}
                         onClick={() => handleToggleModule(key as string, false)}
                         className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                           !state.modules[key]
                             ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-sm'
                             : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-905 dark:hover:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                         } ${isStatic ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
                       >
                         {language === 'id' ? 'Nonaktif' : 'Disable'}
                       </button>
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
        )}
      </div>

      {/* Confirmation Modals (Glassmorphic Overlay Layers) */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-56 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in duration-200">
            
            {/* Header Block with corresponding active states */}
            {activeModal === 'reset' && (
              <>
                <div className="flex items-center gap-3 text-rose-500">
                  <div className="p-2.5 bg-rose-150/20 dark:bg-rose-950/30 rounded-2xl">
                    <AlertTriangle className="w-5 h-5 text-rose-505" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    {language === 'id' ? 'Konfirmasi Reset Data' : 'Confirm Reset Data'}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {language === 'id' 
                     ? 'Apakah Anda yakin ingin menghapus semua data? Tindakan ini akan menghapus semua CoA, Transaksi, Invoice, Budget, Aset, Inventory, dan Payroll. Akun pengguna Anda tidak akan terpengaruh.'
                     : 'Are you sure you want to delete all core ledger datasets? This wipes out your Chart of Accounts, Transactions, Invoices, Budgets, Assets, Inventory, and Payroll records. Your login accounts will remain intact.'}
                </p>
                <div className="flex gap-2.5 border-t border-slate-50 dark:border-slate-800/40 pt-4">
                  <button
                    onClick={() => setActiveModal('none')}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl transition-all"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleResetData}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg shadow-red-500/10 transition-all"
                  >
                    {language === 'id' ? 'Ya, Reset Data' : 'Yes, Reset'}
                  </button>
                </div>
              </>
            )}

            {activeModal === 'restore' && (
              <>
                <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
                  <div className="p-2.5 bg-teal-150/20 dark:bg-teal-950/30 rounded-2xl">
                    <RotateCcw className="w-5 h-5 text-teal-505" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {language === 'id' ? 'Pulihkan Data Seed' : 'Restore Seed'}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {language === 'id' 
                     ? 'Tindakan ini akan menimpa seluruh data transaksional terbaru dan mengembalikannya ke kondisi bawaan sesuai dengan peran (Admin/User) Anda saat ini. Lanjutkan?'
                     : 'This override will overwrite your current active changes and replace them with the distinct original seed dataset tailored for your specific system role (Admin vs User). Proceed?'}
                </p>
                <div className="flex gap-2.5 border-t border-slate-50 dark:border-slate-800/40 pt-4">
                  <button
                    onClick={() => setActiveModal('none')}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl transition-all"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleRestoreData}
                    className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-750 text-white text-xs font-black rounded-xl shadow-lg shadow-teal-500/10 transition-all"
                  >
                    {language === 'id' ? 'Ya, Pulihkan' : 'Yes, Restore'}
                  </button>
                </div>
              </>
            )}

            {activeModal === 'backup_json' && (
              <>
                <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                  <div className="p-2.5 bg-indigo-150/20 dark:bg-indigo-950/30 rounded-2xl">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {language === 'id' ? 'Ekspor Backup JSON' : 'Export JSON Backup'}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {language === 'id' 
                     ? 'Apakah Anda ingin mengunduh salinan cadangan lengkap database Ledger terenkripsi format JSON untuk diarsipkan?'
                     : 'Would you like to export and download a full structural snapshot copy of your active FINAGROW Ledger database as a JSON backup file?'}
                </p>
                <div className="flex gap-2.5 border-t border-slate-50 dark:border-slate-800/40 pt-4">
                  <button
                    onClick={() => setActiveModal('none')}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl transition-all"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleBackupJSON}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-505/10 transition-all"
                  >
                    {language === 'id' ? 'Unduh JSON' : 'Download JSON'}
                  </button>
                </div>
              </>
            )}

            {activeModal === 'backup_csv' && (
              <>
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <div className="p-2.5 bg-emerald-150/20 dark:bg-emerald-950/30 rounded-2xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {language === 'id' ? 'Ekspor Transaksi CSV' : 'Export Transactions CSV'}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {language === 'id' 
                     ? 'Apakah Anda ingin mengekspor seluruh transaksi buku besar saat ini ke format berkas CSV yang kompatibel dengan Microsoft Excel atau Google Sheets?'
                     : 'Would you like to compile and download all general ledger transactions into a standard tabular CSV spreadsheet compatible with Excel or Google Sheets?'}
                </p>
                <div className="flex gap-2.5 border-t border-slate-50 dark:border-slate-800/40 pt-4">
                  <button
                    onClick={() => setActiveModal('none')}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl transition-all"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleBackupCSV}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-505/10 transition-all"
                  >
                    {language === 'id' ? 'Unduh CSV' : 'Download CSV'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
