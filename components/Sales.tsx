import React, { useMemo, useState } from 'react';
import { Invoice, Metric } from '../types';
import StatCard from './StatCard';
import { Plus, Edit2, Trash2, X, AlertTriangle, CheckSquare, Clock, CalendarDays } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';
import { useFMS } from '../context/FMSContext';

const InvoiceStatusBadge: React.FC<{ status: Invoice['status'] }> = ({ status }) => {
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

const Sales: React.FC = () => {
  const { language, t } = useLocalization();
  const { state, dispatch } = useFMS();

  // Overlay Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<string | null>(null);

  // Focus Invoice State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    customerName: '',
    customerEmail: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: '',
    vat: '11',
    status: 'Pending' as Invoice['status'],
  });

  const salesInvoices = useMemo(() => {
    return state.invoices.filter(inv => inv.type === 'AR');
  }, [state.invoices]);

  const totalReceivables = useMemo(() => {
    return salesInvoices
      .filter(i => i.status !== 'Paid')
      .reduce((sum, i) => sum + (i.amount * (1 + (i.vat || 0) / 100)), 0);
  }, [salesInvoices]);

  const overdueInvoices = useMemo(() => {
    return salesInvoices
      .filter(i => i.status === 'Overdue')
      .reduce((sum, i) => sum + (i.amount * (1 + (i.vat || 0) / 100)), 0);
  }, [salesInvoices]);

  const avgInvoiceValue = useMemo(() => {
    if (salesInvoices.length === 0) return 0;
    const totalAmount = salesInvoices.reduce((sum, i) => sum + (i.amount * (1 + (i.vat || 0) / 100)), 0);
    return totalAmount / salesInvoices.length;
  }, [salesInvoices]);

  const revenueYTD = useMemo(() => {
    return salesInvoices
      .reduce((sum, i) => sum + (i.amount * (1 + (i.vat || 0) / 100)), 0);
  }, [salesInvoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: state.currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleOpenAdd = () => {
    const nextInvNumber = `INV-AR-${Date.now().toString().slice(-6)}`;
    setFormData({
      invoiceNumber: nextInvNumber,
      customerName: '',
      customerEmail: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: '',
      vat: '11',
      status: 'Pending',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      customerEmail: invoice.customer.email,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      amount: String(invoice.amount),
      vat: String(invoice.vat || 11),
      status: invoice.status,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.amount) {
      alert(language === 'en' ? 'Please fill in all required fields' : 'Silakan isi semua bidang wajib');
      return;
    }

    const newInvoice: any = {
      invoiceNumber: formData.invoiceNumber,
      customer: {
        id: 'CUST-' + Date.now(),
        name: formData.customerName,
        email: formData.customerEmail || 'billing@customer.com',
      },
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      amount: Number(formData.amount),
      vat: Number(formData.vat),
      status: formData.status,
      type: 'AR' as const,
      cur: state.currency,
      entity: state.activeEntity,
    };

    dispatch({ type: 'ADD_INVOICE', payload: newInvoice });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (!formData.customerName || !formData.amount) {
      alert(language === 'en' ? 'Please fill in all required fields' : 'Silakan isi semua bidang wajib');
      return;
    }

    const updatedInvoice = {
      ...editingInvoice,
      invoiceNumber: formData.invoiceNumber,
      customer: {
        ...editingInvoice.customer,
        name: formData.customerName,
        email: formData.customerEmail || 'billing@customer.com',
      },
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      amount: Number(formData.amount),
      vat: Number(formData.vat),
      status: formData.status,
    };

    dispatch({ type: 'EDIT_INVOICE', payload: updatedInvoice });
    setIsEditModalOpen(false);
    setEditingInvoice(null);
  };

  const confirmDelete = () => {
    if (isDeleteConfirmOpen) {
      dispatch({ type: 'DELETE_INVOICE', payload: isDeleteConfirmOpen });
      setIsDeleteConfirmOpen(null);
    }
  };

  const salesMetrics: Metric[] = [
    { title: t('totalReceivables'), value: formatCurrency(totalReceivables), change: totalReceivables === 0 ? '0.0%' : '+5.8%', changeType: totalReceivables === 0 ? 'increase' : 'increase' },
    { title: t('overdueInvoices'), value: formatCurrency(overdueInvoices), change: overdueInvoices === 0 ? '0.0%' : '+15.2%', changeType: overdueInvoices === 0 ? 'increase' : 'increase' },
    { title: t('avgInvoiceValue'), value: formatCurrency(avgInvoiceValue), change: avgInvoiceValue === 0 ? '0.0%' : '-1.1%', changeType: avgInvoiceValue === 0 ? 'increase' : 'decrease' },
    { title: t('revenueYTD'), value: formatCurrency(revenueYTD), change: revenueYTD === 0 ? '0.0%' : '+22.0%', changeType: 'increase' },
  ];

  return (
    <div className="container mx-auto space-y-6">
      {/* Metrics overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesMetrics.map((metric) => (
          <StatCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Main card panel */}
      <div className="bg-white dark:bg-slate-800/85 backdrop-blur-md p-6 rounded-3xl border border-slate-100 dark:border-slate-700/40 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white">{t('invoices')}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {language === 'en' ? 'Manage, track, and record Customer Sales AR Invoices' : 'Kelola, lacak, dan catat Invoice Penjualan AR Pelanggan'}
            </p>
          </div>
          <button 
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center justify-center bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition transform active:scale-98 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {t('newInvoice')}
          </button>
        </div>

        {/* Sales invoices data table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50">
              <tr>
                <th scope="col" className="px-5 py-3.5">{t('invoice')} #</th>
                <th scope="col" className="px-5 py-3.5">{t('customer')}</th>
                <th scope="col" className="px-5 py-3.5">{t('issueDate')}</th>
                <th scope="col" className="px-5 py-3.5">{t('dueDate')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{t('subtotal')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{t('tax')}</th>
                <th scope="col" className="px-5 py-3.5 text-right">{t('total')}</th>
                <th scope="col" className="px-5 py-3.5 text-center">{t('status')}</th>
                <th scope="col" className="px-5 py-3.5 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
              {salesInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-xs text-slate-400">
                    {language === 'en' ? 'No invoices found. Click New Invoice to begin' : 'Tidak ada invoice ditemukan. Klik Invoice Baru untuk memulai'}
                  </td>
                </tr>
              ) : (
                salesInvoices.map((invoice) => {
                  const subtotal = invoice.amount;
                  const tax = subtotal * ((invoice.vat || 11) / 100);
                  const total = subtotal + tax;
                  return (
                    <tr 
                      key={invoice.id} 
                      className="group bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{invoice.customer.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{invoice.customer.email}</p>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{invoice.issueDate}</td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{invoice.dueDate}</td>
                      <td className="px-5 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-350">
                        {formatCurrency(subtotal)}
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-slate-400 dark:text-slate-500">
                        {formatCurrency(tax)}
                      </td>
                      <td className="px-5 py-4 text-right text-xs font-bold text-slate-950 dark:text-white">
                        {formatCurrency(total)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title={language === 'en' ? 'Edit' : 'Ubah'}
                            onClick={() => handleOpenEdit(invoice)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title={language === 'en' ? 'Delete' : 'Hapus'}
                            onClick={() => setIsDeleteConfirmOpen(invoice.id)}
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
          {salesInvoices.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-450 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl">
              {language === 'en' ? 'No invoices found. Click New Invoice to begin' : 'Tidak ada invoice ditemukan. Klik Invoice Baru untuk memulai'}
            </div>
          ) : (
            salesInvoices.map((invoice) => {
              const subtotal = invoice.amount;
              const tax = subtotal * ((invoice.vat || 11) / 100);
              const total = subtotal + tax;
              return (
                <div 
                  key={invoice.id} 
                  className="p-4 bg-slate-50/50 dark:bg-slate-705/10 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col space-y-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400 block mb-1">
                        {invoice.invoiceNumber}
                      </span>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-tight">{invoice.customer.name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-550 truncate mt-0.5">{invoice.customer.email}</p>
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50 text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-0.5">{t('issueDate')}</span>
                      <span className="font-semibold text-slate-750 dark:text-slate-300">{invoice.issueDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold block mb-0.5">{t('dueDate')}</span>
                      <span className="font-semibold text-slate-750 dark:text-slate-300">{invoice.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold px-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">{t('subtotal')}</span>
                      <span className="text-slate-600 dark:text-slate-400">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] text-slate-400 block">{t('tax')} ({invoice.vat || 11}%)</span>
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
                        onClick={() => handleOpenEdit(invoice)}
                        className="p-2 text-slate-405 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-primary-505/10 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title={language === 'en' ? 'Delete' : 'Hapus'}
                        onClick={() => setIsDeleteConfirmOpen(invoice.id)}
                        className="p-2 text-slate-405 hover:text-rose-505 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* Invoice Add / Edit Modal Overlay */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 sm:rounded-3xl rounded-2xl shadow-2xl w-full max-w-lg border border-slate-150 dark:border-slate-700/60 transition-all transform scale-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/40">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                {isAddModalOpen ? (language === 'en' ? 'Create Sales Invoice (AR)' : 'Buat Invoice Penjualan (AR)') : (language === 'en' ? 'Edit Sales Invoice' : 'Ubah Invoice Penjualan')}
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
                    {language === 'en' ? 'Invoice #' : 'Nomor Invoice'}
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
                    {language === 'en' ? 'Customer Name' : 'Nama Pelanggan'} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.customerName} 
                    onChange={e => setFormData({...formData, customerName: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder={language === 'en' ? 'Intel Corp' : 'PT Maju Jaya'} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Customer Email
                  </label>
                  <input 
                    type="email" 
                    value={formData.customerEmail} 
                    onChange={e => setFormData({...formData, customerEmail: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" 
                    placeholder="billing@company.com" 
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
                  {isAddModalOpen ? (language === 'en' ? 'Add Invoice' : 'Tambah Invoice') : (language === 'en' ? 'Save Changes' : 'Simpan Perubahan')}
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
                {language === 'en' ? 'Delete Sales Invoice' : 'Hapus Invoice'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Are you absolutely sure you want to permanently delete this Sales AR Invoice from corporate journals?'
                  : 'Apakah Anda yakin ingin menghapus permanen Invoice AR Penjualan ini dari jurnal perusahaan?'}
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

export default Sales;
