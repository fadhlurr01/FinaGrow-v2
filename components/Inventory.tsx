import React, { useState } from 'react';
import { useFMS } from '../context/FMSContext';
import { useLocalization } from '../hooks/useLocalization';
import { CubeIcon, PlusIcon } from './icons/IconComponents';
import { Lock, Sparkles, Check, Flame, AlertTriangle, Search, Pencil, Trash2, X } from 'lucide-react';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  valuationMethod: 'FIFO' | 'AVCO' | 'LIFO';
}

const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  { id: '1', sku: 'LAP-PRO-01', name: 'MacBook Pro M3 Max 16"', category: 'Electronics', quantity: 15, unit: 'pcs', unitCost: 35000000, valuationMethod: 'FIFO' },
  { id: '2', sku: 'MON-4K-02', name: 'Dell UltraSharp 32" 4K Monitor', category: 'Accessories', quantity: 24, unit: 'pcs', unitCost: 8500000, valuationMethod: 'AVCO' },
  { id: '3', sku: 'KEY-MECH-03', name: 'Keychron Q1 Pro Mechanical Keyboard', category: 'Accessories', quantity: 50, unit: 'pcs', unitCost: 2200000, valuationMethod: 'FIFO' },
  { id: '4', sku: 'IPH-15P-04', name: 'iPhone 15 Pro Max 256GB', category: 'Electronics', quantity: 12, unit: 'pcs', unitCost: 19500000, valuationMethod: 'LIFO' },
  { id: '5', sku: 'DESK-ERG-05', name: 'Ergonomic Standing Desk Dual Motor', category: 'Furniture', quantity: 8, unit: 'pcs', unitCost: 4500000, valuationMethod: 'AVCO' },
];

const Inventory: React.FC = () => {
  const { state, dispatch } = useFMS();
  const { language, t } = useLocalization();

  const isPro = state.subscription === 'Pro';
  
  const items = React.useMemo(() => {
    return state.inventory || [];
  }, [state.inventory]);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [focusedItem, setFocusedItem] = useState<InventoryItem | null>(null);

  // Form Fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const [unitCost, setUnitCost] = useState(0);
  const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'AVCO' | 'LIFO'>('FIFO');

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Add Item Submit
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || unitCost <= 0) return;

    const newItem = {
      sku,
      name,
      category,
      quantity,
      unit,
      unitCost,
      valuationMethod
    };

    dispatch({ type: 'ADD_INVENTORY_ITEM', payload: newItem });
    setIsAddModalOpen(false);
    
    // Clear Forms
    setSku('');
    setName('');
    setQuantity(1);
    setUnitCost(0);
  };

  // Open Edit Mod
  const handleOpenEdit = (item: InventoryItem) => {
    setFocusedItem(item);
    setSku(item.sku);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setUnitCost(item.unitCost);
    setValuationMethod(item.valuationMethod);
    setIsEditModalOpen(true);
  };

  // Edit Item Save
  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedItem || !sku || !name || unitCost <= 0) return;

    const updated = {
      id: focusedItem.id,
      sku,
      name,
      category,
      quantity,
      unit,
      unitCost,
      valuationMethod
    };

    dispatch({ type: 'EDIT_INVENTORY_ITEM', payload: updated });
    setIsEditModalOpen(false);
    setFocusedItem(null);
  };

  // Open Delete
  const handleOpenDelete = (item: InventoryItem) => {
    setFocusedItem(item);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = () => {
    if (!focusedItem) return;
    dispatch({ type: 'DELETE_INVENTORY_ITEM', payload: focusedItem.id });
    setIsDeleteModalOpen(false);
    setFocusedItem(null);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValuation = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  return (
    <div className="relative min-h-[calc(100vh-10rem)]">
      {/* 1. LOCK SCREEN OVERLAY IF FREE SUBSCRIPTION */}
      {!isPro && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/70 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-600 dark:from-amber-600 dark:to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 mb-6 font-bold">
            <Lock className="w-8 h-8 animate-pulse" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white tracking-tight max-w-lg leading-snug">
            {language === 'id' 
              ? 'Fitur Manajemen & Valuasi Inventaris Terkunci' 
              : 'Inventory Tracker & Valuation is Locked'}
          </h2>
          
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            {language === 'id' 
              ? 'Lacak jumlah stok gudang Anda, lakukan penilaian otomatis real-time menggunakan metode FIFO, LIFO, atau AVCO (Average Cost) secara otomatis.' 
              : 'Monitor real-time warehouse warehouse counts and automate balance sheet item evaluation rules with seamless support for FIFO, LIFO and Average Cost valuations.'}
          </p>

          {/* Premium Spec Card */}
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-150 dark:border-slate-700 max-w-sm text-left shadow-sm space-y-2.5">
            <div className="font-extrabold text-[11px] text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center justify-between">
              <span>{language === 'id' ? 'MANFAAT AKTIF PRO' : 'PRO ACTIVATED BENEFITS'}</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                <Check className="w-4 h-4 text-emerald-505 shrink-0" />
                <span>{language === 'id' ? 'Pelacakan stok multi-gudang real-time' : 'Real-time multi-warehouse stock audit'}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                <Check className="w-4 h-4 text-emerald-505 shrink-0" />
                <span>{language === 'id' ? 'Valuasi FIFO, LIFO, & AVCO Otomatis' : 'Automatic FIFO, LIFO, & Average valuation'}</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold">
                <Check className="w-4 h-4 text-emerald-505 shrink-0" />
                <span>{language === 'id' ? 'Integrasi Neraca Keuangan Langsung' : 'Direct General Ledger & Balance integration'}</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_SUBSCRIPTION', payload: 'Pro' })}
            className="mt-8 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>{language === 'id' ? 'Aktifkan Mode Pro Sekarang' : 'Activate Pro Mode Now'}</span>
          </button>
        </div>
      )}

      {/* 2. INVENTORY UI VIEW FOR PRO USERS */}
      <div className={`space-y-6 ${!isPro ? 'opacity-25 pointer-events-none select-none filter blur-xs' : ''}`}>
        
        {/* Header Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'id' ? 'Total Nilai Inventaris' : 'Total Inventory Valuation'}</span>
            <h4 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white mt-2">{formatMoney(totalValuation)}</h4>
            <span className="text-[10px] text-emerald-500 font-black tracking-wide mt-1.5 inline-flex items-center">{language === 'id' ? 'Metode Selaras Neraca' : 'Synced Balance Method'}</span>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'id' ? 'Jumlah Item Produk' : 'Distinct Stock Items'}</span>
            <h4 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white mt-2">{items.length} SKU</h4>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 inline-block">{language === 'id' ? 'Semua produk terdaftar aktif' : 'All active products inventory'}</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'id' ? 'Unit Fisik Kolektif' : 'Collective Quantity Unit'}</span>
            <h4 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-white mt-2">{items.reduce((sum, item) => sum + item.quantity, 0)} Pcs</h4>
            <span className="text-[10px] text-amber-500 font-black mt-1.5 inline-flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              <span>{language === 'id' ? 'Item aman dalam batas gudang' : 'All items match safe shelf guidelines'}</span>
            </span>
          </div>
        </div>

        {/* Search & Actions Panel */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={language === 'id' ? 'Cari berdasarkan SKU, nama produk...' : 'Filter by SKU, product name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSku(`SKU-${Math.floor(Math.random() * 8999 + 1000)}`);
              setName('');
              setQuantity(1);
              setUnitCost(150000);
              setIsAddModalOpen(true);
            }}
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-750 text-white font-bold text-xs uppercase tracking-wide px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{language === 'id' ? 'Tambah Stok Produk' : 'Add Stock Product'}</span>
          </button>
        </div>

        {/* Database Grid Inventory */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[9px] font-black border-b border-slate-100 dark:border-slate-850">
                <tr>
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">{language === 'id' ? 'Nama Produk' : 'Product Name'}</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Qty / Stock</th>
                  <th className="px-6 py-4 text-right">Unit Cost</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Total Value</th>
                  <th className="px-6 py-4 text-center">{language === 'id' ? 'Kelola' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">{item.sku}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-855 dark:text-slate-100">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold uppercase">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-700 dark:text-white">{formatMoney(item.unitCost)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 text-[9px] rounded font-black border border-slate-205 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-mono">
                        {item.valuationMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-primary-600 dark:text-primary-400">{formatMoney(item.quantity * item.unitCost)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button 
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 px-1.5 text-slate-400 hover:text-indigo-550 rounded hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                          title={language === 'id' ? 'Ubah' : 'Edit'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleOpenDelete(item)}
                          className="p-1 px-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                          title={language === 'id' ? 'Hapus' : 'Delete'}
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
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">
                {language === 'id' ? 'Item tidak ditemukan' : 'No inventory items match search filter.'}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-900 font-mono font-bold text-slate-600 dark:text-slate-450 px-1.5 py-0.5 rounded">
                        {item.sku}
                      </span>
                      <h4 className="font-extrabold text-slate-855 dark:text-slate-100 text-xs sm:text-sm pt-1 leading-snug">{item.name}</h4>
                      <div className="pt-0.5 space-x-1.5">
                        <span className="text-[9px] rounded-lg bg-indigo-50/55 dark:bg-indigo-950/25 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase px-2 py-0.5">{item.category}</span>
                        <span className="text-[9px] rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono font-black border border-slate-205 dark:border-slate-800 px-1 py-0.5">{item.valuationMethod}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-550 rounded hover:bg-slate-105 dark:hover:bg-slate-900 cursor-pointer"
                        title={language === 'id' ? 'Ubah' : 'Edit'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleOpenDelete(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-105 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                        title={language === 'id' ? 'Hapus' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-900/40 p-2 rounded-xl text-[10px] leading-relaxed">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">{language === 'id' ? 'Nama Produk' : 'Quantity'}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.quantity} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">{language === 'id' ? 'Harga Satuan' : 'Unit Cost'}</span>
                      <span className="font-semibold text-slate-655 dark:text-slate-400 block">{formatMoney(item.unitCost)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'id' ? 'Total Nilai' : 'Total Value'}</span>
                    <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                      {formatMoney(item.quantity * item.unitCost)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-905/65 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-black text-slate-850 dark:text-white tracking-tight">
                {language === 'id' ? 'Tambah Unit Inventaris Baru' : 'Add New Inventory Stock'}
              </h3>
              
              <form onSubmit={handleAddItem} className="space-y-4 text-slate-800 dark:text-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">SKU Code</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="SKU Code"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Furniture">Furniture</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">{language === 'id' ? 'Nama Produk' : 'Product Name'}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Product Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Stock Qty</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Unit Cost (IDR)</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value))}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Cost Accounting Valuation Method</label>
                  <select 
                    value={valuationMethod}
                    onChange={(e) => setValuationMethod(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="FIFO">First-In First-Out (FIFO)</option>
                    <option value="AVCO">Weighted Average Cost (AVCO)</option>
                    <option value="LIFO">Last-In First-Out (LIFO)</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-755 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-750 cursor-pointer"
                  >
                    {language === 'id' ? 'Simpan' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal with high-contrast inputs for dark-mode */}
        {isEditModalOpen && focusedItem && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-905/65 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-black text-slate-850 dark:text-white tracking-tight">
                {language === 'id' ? 'Ubah Informasi Produk' : 'Edit Inventory Item'}
              </h3>
              
              <form onSubmit={handleEditItem} className="space-y-4 text-slate-800 dark:text-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">SKU Code</label>
                    <input 
                      type="text" 
                      required 
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Furniture">Furniture</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">{language === 'id' ? 'Nama Produk' : 'Product Name'}</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Stock Qty</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Unit Cost (IDR)</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value))}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-405 dark:text-slate-400 uppercase tracking-widest mb-1.5">Valuation Method</label>
                  <select 
                    value={valuationMethod}
                    onChange={(e) => setValuationMethod(e.target.value as any)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-850 dark:text-white focus:outline-none"
                  >
                    <option value="FIFO">First-In First-Out (FIFO)</option>
                    <option value="AVCO">Weighted Average Cost (AVCO)</option>
                    <option value="LIFO">Last-In First-Out (LIFO)</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-755 text-slate-655 dark:text-slate-350 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-750 cursor-pointer"
                  >
                    {language === 'id' ? 'Perbarui' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Popup */}
        {isDeleteModalOpen && focusedItem && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-910/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-center text-slate-850 dark:text-white animate-in zoom-in-95 duration-250">
              
              <div className="w-14 h-14 bg-rose-50 dark:bg-rose-955/20 rounded-full flex items-center justify-center text-rose-550 mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <h3 className="text-base font-black tracking-tight leading-snug">
                {language === 'id' ? 'Hapus Stok Produk?' : 'Delete Inventory Item?'}
              </h3>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'id' 
                  ? `Apakah Anda yakin ingin menghapus sistem pencatatan stok untuk SKU ${focusedItem.sku} (${focusedItem.name})? Valuasi dan unit penyeimbang neraca akan ditarik.`
                  : `Are you sure you want to permanently delete inventory records for SKU ${focusedItem.sku} (${focusedItem.name})?`}
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
                  onClick={confirmDelete}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {language === 'id' ? 'Ya, Hapus' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Inventory;
