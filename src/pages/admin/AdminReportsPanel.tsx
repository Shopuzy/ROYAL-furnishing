import { useCallback, useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { Enquiry, Order } from '../../types';

export function AdminReportsPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminReports({
        from: from || undefined,
        to: to || undefined,
      });
      setEnquiries(res.enquiries);
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const exportEnquiries = async (format: 'xlsx' | 'csv') => {
    const XLSX = await import('xlsx');
    const rows = enquiries.map((e) => ({
      'Enquiry ID': e.enquiryCode,
      'Customer Name': e.customerName,
      'Mobile Number': e.mobileNumber,
      Email: e.email || '',
      Product: e.productName,
      Category: e.categoryName,
      Quantity: e.quantity,
      Type: e.enquiryType,
      'Delivery Location': e.deliveryLocation,
      Status: e.status,
      Message: e.message,
      'Internal Notes': e.internalNotes,
      'Created At': e.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enquiries');
    XLSX.writeFile(wb, `royal-furnishing-enquiries.${format}`, { bookType: format });
  };

  const exportOrders = async (format: 'xlsx' | 'csv') => {
    const XLSX = await import('xlsx');
    const rows = orders.map((o) => ({
      'Order ID': o.orderCode,
      'Customer Name': o.customerName,
      'Mobile Number': o.mobileNumber,
      Email: o.email || '',
      'Delivery Location': o.deliveryLocation,
      Type: o.orderType,
      Items: o.items.map((i) => `${i.productName} (${i.quantity})`).join('; '),
      'Quoted Amount': o.totalAmount ?? '',
      Status: o.status,
      'Confirmed At': o.confirmedAt ?? '',
      Notes: o.notes,
      'Created At': o.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `royal-furnishing-orders.${format}`, { bookType: format });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">Reports & Data Export</h2>
        <p className="text-sm text-[#57534E]">
          Filter enquiries and orders by date range and export records to Excel (.xlsx) or CSV.
        </p>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-stone-200 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">From Date</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">To Date</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
          />
        </div>
        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
            className="px-4 py-2 min-h-[42px] rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            Clear Dates
          </button>
        )}
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}

      {loading ? (
        <div className="py-16 flex items-center justify-center text-stone-500 gap-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating report data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enquiries Report Card */}
          <div className="rounded-xl bg-white border border-stone-200 p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-semibold text-stone-900">Enquiry Report</h3>
                <p className="text-sm text-stone-500 mt-0.5 tabular-nums">
                  {enquiries.length} enquiry record{enquiries.length === 1 ? '' : 's'} matched
                </p>
              </div>
              <div className="text-right tabular-nums">
                <p className="text-xs text-stone-500">Retail / Wholesale</p>
                <p className="text-sm font-semibold text-stone-900">
                  {enquiries.filter((e) => e.enquiryType === 'Retail').length} /{' '}
                  {enquiries.filter((e) => e.enquiryType === 'Wholesale').length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 text-xs">
              {['New', 'Contacted', 'Quotation Sent', 'Converted to Order', 'Closed'].map((st) => (
                <div key={st} className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <p className="text-stone-500">{st}</p>
                  <p className="text-lg font-semibold text-stone-900 tabular-nums mt-0.5">
                    {enquiries.filter((e) => e.status === st).length}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={enquiries.length === 0}
                onClick={() => exportEnquiries('xlsx')}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold hover:bg-[#2A2624] disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Enquiries (Excel)</span>
              </button>
              <button
                type="button"
                disabled={enquiries.length === 0}
                onClick={() => exportEnquiries('csv')}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Orders Report Card */}
          <div className="rounded-xl bg-white border border-stone-200 p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-semibold text-stone-900">Orders Report</h3>
                <p className="text-sm text-stone-500 mt-0.5 tabular-nums">
                  {orders.length} order record{orders.length === 1 ? '' : 's'} matched
                </p>
              </div>
              <div className="text-right tabular-nums">
                <p className="text-xs text-stone-500">Quoted Value</p>
                <p className="text-sm font-semibold text-stone-900">
                  ₹{orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 text-xs">
              {['New', 'Quotation Sent', 'Confirmed', 'Processing', 'Completed', 'Cancelled'].map((st) => (
                <div key={st} className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                  <p className="text-stone-500">{st}</p>
                  <p className="text-lg font-semibold text-stone-900 tabular-nums mt-0.5">
                    {orders.filter((o) => o.status === st).length}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={orders.length === 0}
                onClick={() => exportOrders('xlsx')}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold hover:bg-[#2A2624] disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Orders (Excel)</span>
              </button>
              <button
                type="button"
                disabled={orders.length === 0}
                onClick={() => exportOrders('csv')}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border border-stone-300 bg-white text-stone-800 text-xs font-semibold hover:bg-stone-50 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
