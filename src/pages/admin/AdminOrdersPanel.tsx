import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Eye, Loader2, MessageCircle, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import type { Order, OrderStatus } from '../../types';

interface AdminOrdersPanelProps {
  onDataChanged: () => void;
}

const ORDER_STATUSES: OrderStatus[] = [
  'New',
  'Contacted',
  'Quotation Sent',
  'Confirmed',
  'Processing',
  'Completed',
  'Cancelled',
];

export function AdminOrdersPanel({ onDataChanged }: AdminOrdersPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selected, setSelected] = useState<Order | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('New');
  const [totalDraft, setTotalDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [newProduct, setNewProduct] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newTotal, setNewTotal] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminOrders({
        search: search.trim() || undefined,
        status: statusFilter,
      });
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrder = (ord: Order) => {
    setSelected(ord);
    setStatusDraft(ord.status);
    setTotalDraft(ord.totalAmount !== null ? String(ord.totalAmount) : '');
    setNotesDraft(ord.notes);
  };

  const handleSaveOrder = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { order } = await api.updateAdminOrder(selected.id, {
        status: statusDraft,
        totalAmount: totalDraft ? Number(totalDraft) : null,
        notes: notesDraft,
      });
      setSelected(order);
      await loadOrders();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createAdminOrder({
        customerName: newCustomer,
        mobileNumber: newMobile,
        deliveryLocation: newLocation,
        orderType: newType,
        totalAmount: newTotal ? Number(newTotal) : null,
        status: 'New',
        items: [
          {
            productName: newProduct,
            categoryName: 'Custom Order',
            quantity: newQty,
          },
        ],
      });
      setShowCreate(false);
      setNewCustomer('');
      setNewMobile('');
      setNewLocation('');
      setNewProduct('');
      setNewQty('');
      setNewTotal('');
      await loadOrders();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.deleteAdminOrder(deleteTarget.id);
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      await loadOrders();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">Orders & Quotations</h2>
          <p className="text-sm text-[#57534E]">
            Orders remain unconfirmed until explicitly marked Confirmed by an administrator.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#181615] text-[#E6CE97] text-xs sm:text-sm font-semibold hover:bg-[#2A2624] self-start cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Order</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl bg-white border border-stone-200">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, customer, mobile, delivery location..."
            className="w-full min-h-[42px] pl-10 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[#C8A45D]"
          />
        </div>
        <div className="md:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
          >
            <option value="All">All Order Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}

      <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-stone-500 gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-500">No orders or quotation requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Quote / Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {orders.map((ord) => {
                  const waUrl = buildWhatsAppUrl(
                    ord.mobileNumber,
                    `Hello ${ord.customerName}, update on your Royal Furnishing order ${ord.orderCode} (${ord.status}).`
                  );
                  return (
                    <tr key={ord.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-stone-800 whitespace-nowrap tabular-nums">
                        {ord.orderCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-900">{ord.customerName}</div>
                        <div className="text-xs text-stone-500 tabular-nums">
                          {ord.mobileNumber} · {ord.deliveryLocation}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-stone-900 font-medium">
                          {ord.items[0]?.productName || 'Material Items'}
                        </div>
                        <div className="text-xs text-stone-500">
                          {ord.orderType} · Qty: {ord.items[0]?.quantity || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-900 tabular-nums whitespace-nowrap">
                        {ord.totalAmount !== null ? `₹${ord.totalAmount.toLocaleString('en-IN')}` : 'Pending Quote'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${
                            ord.status === 'Confirmed' || ord.status === 'Completed'
                              ? 'text-emerald-700'
                              : ord.status === 'Cancelled'
                                ? 'text-red-600'
                                : 'text-amber-700'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openOrder(ord)}
                            className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                            title="Manage Order"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg border border-stone-200 hover:bg-emerald-50 text-emerald-700"
                              title="WhatsApp Customer"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ord)}
                            className="p-2 rounded-lg border border-stone-200 hover:bg-red-50 text-red-600 cursor-pointer"
                            title="Delete Order"
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

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-stone-200 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <span className="font-mono text-xs font-semibold text-[#8C6D32]">{selected.orderCode}</span>
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
                <p className="text-xs text-stone-500">Mobile & Email</p>
                <p className="font-medium text-stone-900 tabular-nums">{selected.mobileNumber}</p>
                {selected.email && <p className="text-xs text-stone-600">{selected.email}</p>}
              </div>
              <div>
                <p className="text-xs text-stone-500">Delivery & Order Type</p>
                <p className="font-medium text-stone-900">
                  {selected.deliveryLocation} ({selected.orderType})
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-stone-50 border border-stone-200 p-4">
              <p className="text-xs font-semibold text-stone-500 mb-2">Requested Materials</p>
              <ul className="space-y-2 text-sm">
                {selected.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-stone-900">{item.productName}</span>
                      {item.finish && <span className="text-xs text-stone-500 ml-1">({item.finish})</span>}
                    </div>
                    <span className="text-xs font-semibold text-stone-700 tabular-nums">Qty: {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Order Status</label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Quoted Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalDraft}
                  onChange={(e) => setTotalDraft(e.target.value)}
                  placeholder="Optional amount"
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Order Notes</label>
              <textarea
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
            </div>

            {selected.confirmedAt && (
              <p className="text-xs text-emerald-700">
                Confirmed at: {new Date(selected.confirmedAt).toLocaleString('en-IN')}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveOrder}
                className="px-5 py-2 min-h-[42px] rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold hover:bg-[#2A2624] cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <form
            onSubmit={handleCreateOrder}
            className="w-full max-w-lg rounded-2xl bg-white border border-stone-200 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-display text-2xl font-semibold text-stone-900">Create Order</h3>
              <button type="button" onClick={() => setShowCreate(false)} className="p-1.5 text-stone-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                placeholder="Customer Name *"
                className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
              <input
                type="tel"
                required
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
                placeholder="Mobile Number *"
                className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
              <input
                type="text"
                required
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Delivery Location *"
                className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'Retail' | 'Wholesale')}
                className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
              </select>
              <input
                type="text"
                required
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="Product Name *"
                className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
              <input
                type="text"
                required
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="Quantity *"
                className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newTotal}
              onChange={(e) => setNewTotal(e.target.value)}
              placeholder="Quoted Total (₹ optional)"
              className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold cursor-pointer"
              >
                {saving ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-stone-900">Delete Order?</h3>
            <p className="mt-2 text-sm text-stone-600">
              Permanently remove order <span className="font-mono font-semibold">{deleteTarget.orderCode}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
