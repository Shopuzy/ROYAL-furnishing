import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  Globe,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  X,
} from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';
import { api, isSupabaseMode } from '../../lib/api';
import { usePageMeta } from '../../lib/seo';
import type { AdminOverviewStats, AdminUser } from '../../types';
import { AdminEnquiriesPanel } from './AdminEnquiriesPanel';
import { AdminOrdersPanel } from './AdminOrdersPanel';
import { AdminProductsPanel } from './AdminProductsPanel';
import { AdminReportsPanel } from './AdminReportsPanel';
import { AdminWebsitePanel } from './AdminWebsitePanel';

type AdminTab = 'overview' | 'enquiries' | 'orders' | 'products' | 'website' | 'reports' | 'security';

interface AdminDashboardProps {
  user: AdminUser;
  onLogout: () => void;
  onPublicDataRefresh: () => void;
}

export function AdminDashboard({ user, onLogout, onPublicDataRefresh }: AdminDashboardProps) {
  usePageMeta({
    title: 'Admin Dashboard – Royal Furnishing',
    description: 'Royal Furnishing business administration dashboard.',
  });

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewStats | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Account security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRecoveryCode, setNewRecoveryCode] = useState('');
  const [secMsg, setSecMsg] = useState<string | null>(null);
  const [secErr, setSecErr] = useState<string | null>(null);
  const [secSaving, setSecSaving] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const stats = await api.getAdminOverview();
      setOverview(stats);
    } catch {
      // ignore if session expired; handled by parent
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleDataChanged = () => {
    loadOverview();
    onPublicDataRefresh();
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSecErr(null);
    setSecMsg(null);
    setSecSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setSecMsg('Password updated successfully.');
    } catch (err) {
      setSecErr(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSecSaving(false);
    }
  };

  const handleUpdateRecovery = async (e: FormEvent) => {
    e.preventDefault();
    setSecErr(null);
    setSecMsg(null);
    setSecSaving(true);
    try {
      await api.updateRecoveryCode(currentPassword, newRecoveryCode);
      setCurrentPassword('');
      setNewRecoveryCode('');
      setSecMsg('Recovery passkey updated successfully.');
    } catch (err) {
      setSecErr(err instanceof Error ? err.message : 'Unable to update recovery passkey.');
    } finally {
      setSecSaving(false);
    }
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'enquiries', label: 'Enquiries', icon: ClipboardList },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'products', label: 'Products & Categories', icon: Package },
    { id: 'website', label: 'Website & Gallery', icon: Globe },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'security', label: 'Account Security', icon: KeyRound },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-5 bg-[#181615] text-[#FAF7F2]">
      <div>
        <div className="pb-5 border-b border-white/10">
          <BrandLogo variant="light" compact />
          <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#A89F91]">Admin Console</p>
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#C8A45D] text-[#181615] font-semibold'
                    : 'text-[#D6CFC4] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-5 border-t border-white/10 space-y-3">
        <div className="px-2">
          <p className="text-xs font-semibold text-[#FAF7F2] truncate">{user.name}</p>
          <p className="text-[11px] text-[#A89F91] truncate">{user.email}</p>
        </div>

        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[40px] px-3.5 py-2 rounded-lg border border-white/15 text-xs font-medium text-[#E6CE97] hover:bg-white/5 flex items-center justify-between"
        >
          <span>View Public Website</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-white/5 hover:bg-red-950/70 text-xs font-semibold text-[#F5EFE6] hover:text-red-200 flex items-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F2EC] text-[#1C1917] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-stone-200 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 z-10 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close admin menu"
              className="absolute top-4 right-4 p-2 rounded-lg text-white/70 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-stone-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin menu"
              className="lg:hidden p-2.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium text-stone-500 truncate">
              Royal Furnishing <span className="mx-1.5 text-stone-300">/</span>{' '}
              <span className="text-stone-900 font-semibold">
                {navItems.find((i) => i.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917]">
                  Dashboard Overview
                </h1>
                <p className="text-sm text-[#57534E] mt-1">
                  Live metrics from your Royal Furnishing enquiries, orders, and product catalog.
                </p>
              </div>

              {loadingOverview || !overview ? (
                <div className="py-16 flex items-center justify-center text-stone-500 gap-2 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading summary...</span>
                </div>
              ) : (
                <>
                  {/* 6 KPI Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {[
                      { label: 'Total Enquiries', value: overview.totalEnquiries, tab: 'enquiries' as AdminTab },
                      { label: 'New Enquiries', value: overview.newEnquiries, tab: 'enquiries' as AdminTab },
                      { label: 'Pending Quotations', value: overview.pendingQuotations, tab: 'orders' as AdminTab },
                      { label: 'Confirmed Orders', value: overview.confirmedOrders, tab: 'orders' as AdminTab },
                      { label: 'Completed Orders', value: overview.completedOrders, tab: 'orders' as AdminTab },
                      {
                        label: 'Total Products',
                        value: overview.totalProducts,
                        sub: `${overview.publishedProducts} published`,
                        tab: 'products' as AdminTab,
                      },
                    ].map((card) => (
                      <button
                        key={card.label}
                        type="button"
                        onClick={() => setActiveTab(card.tab)}
                        className="p-5 rounded-xl bg-white border border-stone-200 text-left hover:border-[#C8A45D] transition-colors cursor-pointer"
                      >
                        <p className="text-xs font-medium text-stone-500">{card.label}</p>
                        <p className="font-display text-3xl sm:text-4xl font-semibold text-stone-900 tabular-nums mt-2">
                          {card.value}
                        </p>
                        {card.sub && <p className="text-xs text-stone-500 mt-1">{card.sub}</p>}
                      </button>
                    ))}
                  </div>

                  {/* Recent Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                        <h2 className="font-display text-xl font-semibold text-stone-900">Recent Enquiries</h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('enquiries')}
                          className="text-xs font-semibold text-[#8C6D32] hover:underline cursor-pointer"
                        >
                          View All
                        </button>
                      </div>
                      {overview.recentEnquiries.length === 0 ? (
                        <div className="p-8 text-center text-sm text-stone-500">No enquiries submitted yet.</div>
                      ) : (
                        <div className="divide-y divide-stone-100">
                          {overview.recentEnquiries.map((e) => (
                            <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <p className="font-medium text-stone-900 truncate">
                                  {e.customerName}{' '}
                                  <span className="font-mono text-xs text-stone-500">· {e.enquiryCode}</span>
                                </p>
                                <p className="text-xs text-stone-500 truncate">
                                  {e.productName} ({e.quantity})
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-amber-700 shrink-0">{e.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                        <h2 className="font-display text-xl font-semibold text-stone-900">Recent Orders</h2>
                        <button
                          type="button"
                          onClick={() => setActiveTab('orders')}
                          className="text-xs font-semibold text-[#8C6D32] hover:underline cursor-pointer"
                        >
                          View All
                        </button>
                      </div>
                      {overview.recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-sm text-stone-500">No orders recorded yet.</div>
                      ) : (
                        <div className="divide-y divide-stone-100">
                          {overview.recentOrders.map((o) => (
                            <div key={o.id} className="px-5 py-3.5 flex items-center justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <p className="font-medium text-stone-900 truncate">
                                  {o.customerName}{' '}
                                  <span className="font-mono text-xs text-stone-500">· {o.orderCode}</span>
                                </p>
                                <p className="text-xs text-stone-500 truncate">
                                  {o.items[0]?.productName || 'Order Items'} · {o.orderType}
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-stone-800 shrink-0">{o.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'enquiries' && <AdminEnquiriesPanel onDataChanged={handleDataChanged} />}
          {activeTab === 'orders' && <AdminOrdersPanel onDataChanged={handleDataChanged} />}
          {activeTab === 'products' && <AdminProductsPanel onDataChanged={handleDataChanged} />}
          {activeTab === 'website' && <AdminWebsitePanel onDataChanged={handleDataChanged} />}
          {activeTab === 'reports' && <AdminReportsPanel />}

          {activeTab === 'security' && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">Account Security</h2>
                <p className="text-sm text-[#57534E]">
                  Update your administrator password or recovery passkey.
                </p>
              </div>

              {secErr && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">{secErr}</div>
              )}
              {secMsg && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {secMsg}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="p-6 rounded-xl bg-white border border-stone-200 space-y-4">
                <h3 className="font-display text-xl font-semibold text-stone-900">Change Password</h3>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    New Password (min 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={secSaving}
                  className="px-5 py-2.5 min-h-[42px] rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold cursor-pointer"
                >
                  Update Password
                </button>
              </form>

              {!isSupabaseMode && (
                <form onSubmit={handleUpdateRecovery} className="p-6 rounded-xl bg-white border border-stone-200 space-y-4">
                  <h3 className="font-display text-xl font-semibold text-stone-900">Update Recovery Passkey</h3>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      New Recovery Passkey (min 6 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newRecoveryCode}
                      onChange={(e) => setNewRecoveryCode(e.target.value)}
                      className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={secSaving}
                    className="px-5 py-2.5 min-h-[42px] rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-900 text-xs font-semibold cursor-pointer"
                  >
                    Update Recovery Passkey
                  </button>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
