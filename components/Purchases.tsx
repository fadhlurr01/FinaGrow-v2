import React, { useMemo, useState } from 'react';
import { Invoice, Metric } from '../types';
import StatCard from './StatCard';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';
import { useFMS } from '../context/FMSContext';

const BillStatusBadge: React.FC<{ status: Invoice['status'] }> = ({ status }) => {
  const { t } = useLocalization();
  const baseClasses = 'px-2.5 py-1 text-[11px] font-bold rounded-full inline-flex items-center gap-1.5';
  let specificClasses = '';

  switch (status) {
    case 'Paid':
      specificClasses = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      break;
    case 'Pending':
      specificClasses = 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      break;
    case 'Overdue':
      specificClasses = 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400';
      break;
  }
  return (
    <span className={`${baseClasses} ${specificClasses}`}>
      {t(status.toLowerCase())}
    </span>
  );
};

const Purchases: React.FC = () => {
  const { language, t } = useLocalization();
  const { state, dispatch } = useFMS();

  // Dialog overlay states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Focus Bill state
  const [editingBill, setEditingBill] = useState<Invoice | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    vendorName: '',
    vendorEmail: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: '',
    vat: '11',
    status: 'Pending' as Invoice['status'],
  });

  const purchaseBills = useMemo(() => {
    return state.invoices.filter(inv => inv.type === 'AP');
  }, [state.invoices]);

  const totalPayables = useMemo(() => {
    return purchaseBills
      .filter(i => i.status !== 'Paid')
      .reduce((sum, i) => sum + (i.amount * (1 + (i.vat || 0) / 100)), 0);
  }, [purchaseBills]);

  const overdueBills = useMemo(() => {
    return purchaseBills
      .filter(i => i.status === 'Overdue')
      .reduce((sum, i) => sum + (i.amount * (1 + (i.vat || 0) / 100)), 0);
  }, [purchaseBills]);

  const paidThisMonth = useMemo(() => {
    return purchaseBills
      .filter(i => i.status === 'Paid')
      .reduce((sum, i) => sum + (i.amount * (1 + (i.vat || 0) / 100)), 0);
  }, [purchaseBills]);

  const avgBillValue = useMemo(() => {
    if (purchaseBills.length === 0) return 0;
    const totalAmount = purchaseBills.reduce((sum, i) => sum + (i.amount * (1 + (i.vat || 0) / 100)), 0);
    return totalAmount / purchaseBills.length;
  }, [purchaseBills]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleOpenAdd = () => {
    const nextBillNumber = `BILL-AP-${Date.now().toString().slice(-6)}`;
    setFormData({
      invoiceNumber: nextBillNumber,
      vendorName: '',
      vendorEmail: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: '',
      vat: '11',
      status: 'Pending',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (bill: Invoice) => {
    setEditingBill(bill);
    setFormData({
      invoiceNumber: bill.invoiceNumber,
      vendorName: bill.customer.name,
      vendorEmail: bill.customer.email,
      issueDate: bill.issueDate,
      dueDate: bill.dueDate,
      amount: String(bill.amount),
      vat: String(bill.vat || 11),
      status: bill.status,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorName || !formData.amount) {
      alert(language === 'en' ? 'Please fill in all required fields' : 'Silakan isi semua bidang wajib');
      return;
    }

    const newBill: any = {
      invoiceNumber: formData.invoiceNumber,
      customer: {
        id: 'VEND-' + Date.now(),
        name: formData.vendorName,
        email: formData.vendorEmail || 'billing@vendor.com',
      },
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      amount: Number(formData.amount),
      vat: Number(formData.vat),
      status: formData.status,
      type: 'AP' as const,
      cur: state.currency,
      entity: state.activeEntity,
    };

    dispatch({ type: 'ADD_INVOICE', payload: newBill });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;
    if (!formData.vendorName || !formData.amount) {
      alert(language === 'en' ? 'Please fill in all required fields' : 'Silakan isi semua bidang wajib');
      return;
    }

    const updatedBill = {
      ...editingBill,
      invoiceNumber: formData.invoiceNumber,
      customer: {
        ...editingBill.customer,
        name: formData.vendorName,
        email: formData.vendorEmail || 'billing@vendor.com',
      },
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      amount: Number(formData.amount),
      vat: Number(formData.vat),
      status: formData.status,
    };

    dispatch({ type: 'EDIT_INVOICE', payload: updatedBill });
    setIsEditModalOpen(false);
    setEditingBill(null);
  };

  const confirmDelete = () => {
    if (isDeleteConfirmOpen) {
      dispatch({ type: 'DELETE_INVOICE', payload: isDeleteConfirmOpen });
      setIsDeleteConfirmOpen(null);
    }
  };

  const purchaseMetrics: Metric[] = [
    { title: t('totalPayables'), value: formatCurrency(totalPayables), change: totalPayables === 0 ? '0.0%' : '+3.2%', changeType: totalPayables === 0 ? 'increase' : 'increase' },
    { title: t('overdueBills'), value: formatCurrency(overdueBills), change: overdueBills === 0 ? '0.0%' : '+20.0%', changeType: overdueBills === 0 ? 'increase' : 'increase' },
    { title: t('paidThisMonth'), value: formatCurrency(paidThisMonth), change: paidThisMonth === 0 ? '0.0%' : '+18.5%', changeType: paidThisMonth === 0 ? 'increase' : 'increase' },
    { title: t('avgBillValue'), value: formatCurrency(avgBillValue), change: avgBillValue === 0 ? '0.0%' : '+2.1%', changeType: avgBillValue === 0 ? 'increase' : 'increase' },
  ];

  return (
    <div className="container mx-auto space-y-6">
      {/* Metrics board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {purchaseMetrics.map((metric) => (
          <StatCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Main invoices card */}
      <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-700/40 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">{t('vendorBills')}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'en' ? 'Track corporate accounts payable vendor bills, dates and dues' : 'Lacak tagihan vendor utang usaha perusahaan, tanggal pembayaran dan jatuh tempo'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition transform active:scale-98 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('newBill')}
          </button>
        </div>

        {/* Data list view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50">
              <tr>
                <th scope="col" className="px-5 py-3.5">{t('vendor')}</th>
                <th scope="col" className="px-5 py-3.5">{t('billDate')}</th>
                <th scope="col" className="px-5 py-3.5">{t('dueDate')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{t('subtotal')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{t('tax')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{t('total')}</th>
                <th scope="col" className="px-5 py-3.5 text-center">{t('status')}</th>
                <th scope="col" className="px-5 py-3.5 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {purchaseBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs text-slate-400">
                    {language === 'en' ? 'No vendor bills found. Click New Bill to start' : 'Tidak ada tagihan vendor ditemukan. Klik Tagihan Baru untuk memulai'}
                  </td>
                </tr>
              ) : (
                purchaseBills.map((bill) => {
                  const subtotal = bill.amount;
                  const tax = subtotal * ((bill.vat || 11) / 100);
                  const total = subtotal + tax;
                  return (
                    <tr 
                      key={bill.id} 
                      className="group bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-5 py-4 text-xs font-bold text-slate-855 dark:text-slate-200">
                        <p className="font-extrabold text-slate-800 dark:text-slate-200">{bill.customer.name}</p>
                        <p className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">#{bill.invoiceNumber}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{bill.issueDate}</td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{bill.dueDate}</td>
                      <td className="px-5 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-350">
                        {formatCurrency(subtotal)}
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-slate-400 dark:text-slate-500">
                        {formatCurrency(tax)}
                      </td>
                      <td className="px-5 py-4 text-right text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <BillStatusBadge status={bill.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title={language === 'en' ? 'Edit' : 'Ubah'}
                            onClick={() => handleOpenEdit(bill)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title={language === 'en' ? 'Delete' : 'Hapus'}
                            onClick={() => setIsDeleteConfirmOpen(bill.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-405 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards stack view */}
        <div className="block md:hidden space-y-4">
          {purchaseBills.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-405 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl">
              {language === 'en' ? 'No vendor bills found. Click New Bill to start' : 'Tidak ada tagihan vendor ditemukan. Klik Tagihan Baru untuk memulai'}
            </div>
          ) : (
            purchaseBills.map((bill) => {
              const subtotal = bill.amount;
              const tax = subtotal * ((bill.vat || 11) / 100);
              const total = subtotal + tax;
              return (
                <div 
                  key={bill.id} 
                  className="p-4 bg-slate-50/50 dark:bg-slate-705/10 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-tight">{bill.customer.name}</h4>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-550 block mt-1">#{bill.invoiceNumber}</span>
                    </div>
                    <BillStatusBadge status={bill.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-0.5">{t('billDate')}</span>
                      <span className="font-semibold text-slate-750 dark:text-slate-300">{bill.issueDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-0.5">{t('dueDate')}</span>
                      <span className="font-semibold text-slate-750 dark:text-slate-300">{bill.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold px-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">{t('subtotal')}</span>
                      <span className="text-slate-600 dark:text-slate-400">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">{t('tax')} ({bill.vat || 11}%)</span>
                      <span className="text-slate-500 dark:text-slate-400">{formatCurrency(tax)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800/60 font-sans">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black block">{t('total')}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">{formatCurrency(total)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        title={language === 'en' ? 'Edit' : 'Ubah'}
                        onClick={() => handleOpenEdit(bill)}
                        className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title={language === 'en' ? 'Delete' : 'Hapus'}
                        onClick={() => setIsDeleteConfirmOpen(bill.id)}
                        className="p-2 text-slate-400 hover:text-rose-505 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bill Add / Edit Modal Overlay */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 sm:rounded-3xl rounded-2xl shadow-2xl w-full max-w-lg border border-slate-150 dark:border-slate-700/60 transition-all transform scale-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/40">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                {isAddModalOpen ? (language === 'en' ? 'Record Vendor Bill (AP)' : 'Catat Tagihan Vendor (AP)') : (language === 'en' ? 'Edit Vendor Bill' : 'Ubah Tagihan Vendor')}
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
                    {language === 'en' ? 'Bill Number' : 'Nomor Tagihan'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.invoiceNumber} 
                    onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'en' ? 'Subtotal (Before Tax)' : 'Subtotal (Sebelum Pajak)'} <span className="text-red-500">*</span>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {language === 'en' ? 'Vendor Name' : 'Nama Vendor'} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.vendorName} 
                    onChange={e => setFormData({...formData, vendorName: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="e.g., AWS Cloud Services" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Vendor Email
                  </label>
                  <input 
                    type="email" 
                    value={formData.vendorEmail} 
                    onChange={e => setFormData({...formData, vendorEmail: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="billing@vendor.com" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('issueDate')}
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.issueDate} 
                    onChange={e => setFormData({...formData, issueDate: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('dueDate')}
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.dueDate} 
                    onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    VAT Tax (%)
                  </label>
                  <select 
                    value={formData.vat} 
                    onChange={e => setFormData({...formData, vat: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="0">0% (exempt)</option>
                    <option value="11">11% (default)</option>
                    <option value="12">12% (new rate)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as Invoice['status']})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Pending">{t('pending')}</option>
                    <option value="Paid">{t('paid')}</option>
                    <option value="Overdue">{t('overdue')}</option>
                  </select>
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
                  {isAddModalOpen ? (language === 'en' ? 'Add Bill' : 'Tambah Tagihan') : (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')}
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
                {language === 'en' ? 'Delete Vendor Bill' : 'Hapus Tagihan Vendor'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Are you absolutely sure you want to permanently delete this Vendor AP Bill from corporate accounts?'
                  : 'Apakah Anda yakin ingin menghapus permanen Tagihan AP Vendor ini dari akun perusahaan?'}
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

export default Purchases;
