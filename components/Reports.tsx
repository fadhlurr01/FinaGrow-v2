import React from 'react';
import { ReportCardType } from '../types';
import { ScaleIcon, DocumentChartBarIcon, ArrowTrendingUpIcon, BuildingStorefrontIcon, ArrowsRightLeftIcon, ReceiptPercentIcon, ArrowDownOnSquareIcon } from './icons/IconComponents';
import { useLocalization } from '../hooks/useLocalization';
import { useFMS } from '../context/FMSContext';

const ReportCard: React.FC<{ report: ReportCardType, onDownload: () => void }> = ({ report, onDownload }) => {
    const { t } = useLocalization();
    const { title, description, icon: Icon } = report;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div>
                <div className="flex items-center mb-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg mr-4">
                        <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-white">{t(title)}</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {t(description)}
                </p>
            </div>
            <div className="flex items-center space-x-2">
                 <button className="w-full text-center bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-100 dark:hover:bg-gray-600">
                    {t('viewReport')}
                </button>
                <button 
                  onClick={onDownload}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  aria-label={`Download ${t(title)}`}
                  title={`Download ${t(title)}`}
                >
                    <ArrowDownOnSquareIcon className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
            </div>
        </div>
    );
};

const Reports: React.FC = () => {
    const { t } = useLocalization();
    const { state } = useFMS();

    const handleDownload = (reportType: string, titleTranslated: string) => {
        let csvContent = '';
        const delimiter = ',';
        
        const escapeCsv = (str: any) => {
          const s = String(str || '');
          if (s.includes(delimiter) || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        };

        let headers: string[] = [];
        let rows: any[][] = [];

        switch (reportType) {
          case 'pnl':
          case 'cashFlow':
          case 'balanceSheet': {
            headers = ['Date', 'Description', 'Amount', 'Currency', 'Type', 'Category', 'Entity'];
            rows = state.transactions.map(tx => [
                tx.date,
                tx.description,
                tx.amount,
                tx.cur,
                tx.type,
                tx.category || '',
                tx.entity || ''
            ]);
            break;
          }
          case 'invoiceAging':
          case 'salesByCustomer': {
             const ar = state.invoices.filter(i => i.type === 'AR');
             headers = ['Invoice Number', 'Customer', 'Issue Date', 'Due Date', 'Amount', 'Currency', 'VAT Rate', 'Status'];
             rows = ar.map(i => [
                 i.invoiceNumber,
                 i.customer.name,
                 i.issueDate,
                 i.dueDate,
                 i.amount,
                 i.cur,
                 i.vat ? `${i.vat}%` : '0%',
                 i.status
             ]);
             break;
          }
          case 'billsAging':
          case 'expensesByVendor': {
             const ap = state.invoices.filter(i => i.type === 'AP');
             headers = ['Bill Number', 'Vendor', 'Issue Date', 'Due Date', 'Amount', 'Currency', 'VAT Rate', 'Status'];
             rows = ap.map(i => [
                 i.invoiceNumber,
                 i.customer.name,
                 i.issueDate,
                 i.dueDate,
                 i.amount,
                 i.cur,
                 i.vat ? `${i.vat}%` : '0%',
                 i.status
             ]);
             break;
          }
          case 'vatReport': {
             const taxInvoices = state.invoices.filter(i => i.vat && i.vat > 0);
             headers = ['Document Number', 'Party', 'Type', 'Subtotal', 'VAT Rate', 'VAT Amount', 'Currency'];
             rows = taxInvoices.map(i => [
                 i.invoiceNumber,
                 i.customer.name,
                 i.type === 'AR' ? 'Output VAT' : 'Input VAT',
                 i.amount,
                 `${i.vat}%`,
                 i.amount * ((i.vat || 0) / 100),
                 i.cur
             ]);
             break;
          }
          case 'payrollTaxReport': {
             const payroll = state.payrollRuns || [];
             headers = ['Pay Period', 'Run Date', 'Total Gross', 'Total Taxes', 'Total Net', 'Status'];
             rows = payroll.map(p => [
                 p.payPeriod,
                 p.runDate,
                 p.totalGross,
                 p.totalTaxes,
                 p.totalNet,
                 p.status
             ]);
             break;
          }
          default:
             headers = ['Message'];
             rows = [['No data template for this report']];
        }

        csvContent = [
            headers.join(delimiter),
            ...rows.map(row => row.map(cell => escapeCsv(cell)).join(delimiter))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${titleTranslated.replace(/\s+/g, '_')}_export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const availableReports: ReportCardType[] = [
        { title: 'pnl', description: 'pnlDesc', icon: DocumentChartBarIcon, category: 'Financial Statements' },
        { title: 'balanceSheet', description: 'balanceSheetDesc', icon: ScaleIcon, category: 'Financial Statements' },
        { title: 'cashFlow', description: 'cashFlowDesc', icon: ArrowsRightLeftIcon, category: 'Financial Statements' },
        { title: 'invoiceAging', description: 'invoiceAgingDesc', icon: ArrowTrendingUpIcon, category: 'Sales & Receivables' },
        { title: 'salesByCustomer', description: 'salesByCustomerDesc', icon: ArrowTrendingUpIcon, category: 'Sales & Receivables' },
        { title: 'billsAging', description: 'billsAgingDesc', icon: BuildingStorefrontIcon, category: 'Purchases & Payables' },
        { title: 'expensesByVendor', description: 'expensesByVendorDesc', icon: BuildingStorefrontIcon, category: 'Purchases & Payables' },
        { title: 'vatReport', description: 'vatReportDesc', icon: ReceiptPercentIcon, category: 'Tax' },
        { title: 'payrollTaxReport', description: 'payrollTaxReportDesc', icon: ReceiptPercentIcon, category: 'Tax' },
    ];
    
    const categories: Record<string, string> = {
        'Financial Statements': 'financialStatements',
        'Sales & Receivables': 'salesAndReceivables',
        'Purchases & Payables': 'purchasesAndPayables',
        'Tax': 'tax',
    };

    const categoryOrder = ['Financial Statements', 'Sales & Receivables', 'Purchases & Payables', 'Tax'];

    return (
        <div className="container mx-auto">
            {categoryOrder.map(category => (
                <div key={category} className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">{t(categories[category])}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableReports.filter(report => report.category === category).map(report => (
                            <ReportCard 
                                key={report.title} 
                                report={report} 
                                onDownload={() => handleDownload(report.title, t(report.title))}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Reports;