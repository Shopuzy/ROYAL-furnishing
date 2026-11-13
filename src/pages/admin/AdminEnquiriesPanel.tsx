import { useCallback, useEffect, useState } from 'react';
import { ArrowRightLeft, Eye, Loader2, MessageCircle, Search, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import type { Enquiry, EnquiryStatus } from '../../types';

interface AdminEnquiriesPanelProps {
  onDataChanged: () => void;
}

const ENQUIRY_STATUSES: EnquiryStatus[] = ['New', 'Contacted', 'Quotation Sent', 'Converted to Order', 'Closed'];

export function AdminEnquiriesPanel({ onDataChanged }: AdminEnquiriesPanelProps) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<EnquiryStatus>('New');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminEnquiries({
        search: search.trim() || undefined,
        status: statusFilter,
        type: typeFilter,
      });
      setEnquiries(res.enquiries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const openDetail = (enq: Enquiry) => {
    setSelected(enq);
    setNotesDraft(enq.internalNotes);
    setStatusDraft(enq.status);
  };

  const handleSaveDetail = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { enquiry } = await api.updateAdminEnquiry(selected.id, {
        status: statusDraft,
        internalNotes: notesDraft,
      });
      setSelected(enquiry);
      await loadEnquiries();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update enquiry.');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertOrder = async (enq: Enquiry) => {
    setSaving(true);
    try {
      await api.convertEnquiryToOrder(enq.id, { status: 'Quotation Sent' });
      setSelected(null);
      await loadEnquiries();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert enquiry to order.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAdminEnquiry(deleteTarget.id);
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      await loadEnquiries();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete enquiry.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">Customer Enquiries</h2>
          <p className="text-sm text-[#57534E]">
            Review quotation requests, update follow-up status, add internal notes, or convert enquiries into orders.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl bg-white border border-stone-200">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference ID, customer, mobile, product, location..."
            className="w-full min-h-[42px] pl-10 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[#C8A45D]"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
          >
            <option value="All">All Statuses</option>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
          >
            <option value="All">Retail & Wholesale</option>
            <option value="Retail">Retail Only</option>
            <option value="Wholesale">Wholesale Only</option>
          </select>
        </div>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}

      {/* Table */}
      <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-stone-500 gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading enquiries...</span>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-500">
            No customer enquiries match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product & Qty</th>
                  <th className="py-3 px-4">Type & Location</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {enquiries.map((enq) => {
                  const customerWaUrl = buildWhatsAppUrl(
                    enq.mobileNumber,
                    `Hello ${enq.customerName}, thank you for your Royal Furnishing enquiry (${enq.enquiryCode}) regarding ${enq.productName}.`
                  );
                  return (
                    <tr key={enq.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-stone-800 whitespace-nowrap tabular-nums">
                        {enq.enquiryCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-900">{enq.customerName}</div>
                        <div className="text-xs text-stone-500 tabular-nums">{enq.mobileNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-900">{enq.productName}</div>
                        <div className="text-xs text-stone-500">Qty: {enq.quantity}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-stone-800">{enq.enquiryType}</div>
                        <div className="text-xs text-stone-500">{enq.deliveryLocation}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-stone-500 whitespace-nowrap tabular-nums">
                        {new Date(enq.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            enq.status === 'New'
                              ? 'text-amber-700'
                              : enq.status === 'Converted to Order'
                                ? 'text-emerald-700'
                                : 'text-stone-700'
                          }`}
                        >
                          {enq.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openDetail(enq)}
                            title="Inspect & Update"
                            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {customerWaUrl && (
                            <a
                              href={customerWaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp Customer"
                              className="p-2 rounded-lg border border-stone-200 hover:bg-emerald-50 text-emerald-700"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(enq)}
                            title="Delete Enquiry"
                            className="p-2 rounded-lg border border-stone-200 hover:bg-red-50 text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enquiry Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-stone-200 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <span className="font-mono text-xs font-semibold text-[#8C6D32]">{selected.enquiryCode}</span>
                <h3 className="font-display text-2xl font-semibold text-stone-900 mt-0.5">{selected.customerName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-stone-500">Mobile Number</p>
                <p className="font-medium text-stone-900 tabular-nums">{selected.mobileNumber}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Email</p>
                <p className="font-medium text-stone-900">{selected.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Product / Category</p>
                <p className="font-medium text-stone-900">
                  {selected.productName} ({selected.categoryName})
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Quantity & Type</p>
                <p className="font-medium text-stone-900">
                  {selected.quantity} · {selected.enquiryType}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Delivery Location</p>
                <p className="font-medium text-stone-900">{selected.deliveryLocation}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500">Submitted</p>
                <p className="font-medium text-stone-900 tabular-nums">
                  {new Date(selected.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {selected.message && (
              <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 text-sm text-stone-700">
                <p className="text-xs font-semibold text-stone-500 mb-1">Customer Message</p>
                <p>{selected.message}</p>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Enquiry Status</label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as EnquiryStatus)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                >
                  {ENQUIRY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Internal Admin Notes</label>
                <textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Quoted rates, sample status, follow-up call summary..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
              {selected.status !== 'Converted to Order' && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleConvertOrder(selected)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border border-[#C8A45D] text-[#8C6D32] hover:bg-[#FAF7F2] text-xs font-semibold cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Convert to Order</span>
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-4 py-2.5 min-h-[42px] rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveDetail}
                  className="px-5 py-2.5 min-h-[42px] rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold hover:bg-[#2A2624] cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-stone-900">Delete Enquiry?</h3>
            <p className="mt-2 text-sm text-stone-600">
              Permanently remove enquiry <span className="font-mono font-semibold">{deleteTarget.enquiryCode}</span>{' '}
              from <span className="font-medium">{deleteTarget.customerName}</span>? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 min-h-[40px] rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="px-4 py-2 min-h-[40px] rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
