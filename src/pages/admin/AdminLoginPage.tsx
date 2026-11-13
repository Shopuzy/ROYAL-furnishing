import { useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';
import { api, isSupabaseMode } from '../../lib/api';
import { getSupabaseClient } from '../../lib/supabase';
import { usePageMeta } from '../../lib/seo';
import type { AdminUser } from '../../types';

interface AdminLoginPageProps {
  hasAdmin: boolean;
  onSuccess: (user: AdminUser) => void;
}

export function AdminLoginPage({ hasAdmin, onSuccess }: AdminLoginPageProps) {
  usePageMeta({
    title: 'Administrator Portal – Royal Furnishing',
    description: 'Secure administrator authentication for Royal Furnishing management console.',
  });

  const location = useLocation();
  const resetState = (location.state as { passwordResetSuccess?: boolean } | null)?.passwordResetSuccess;

  const [mode, setMode] = useState<'login' | 'setup' | 'reset' | 'recovery_update'>(hasAdmin ? 'login' : 'setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(
    resetState ? 'Password updated successfully. Sign in with your new administrator password.' : null
  );

  useEffect(() => {
    if (!isSupabaseMode) return;
    if (window.location.hash.includes('type=recovery')) {
      setMode('recovery_update');
    }
    const supabase = getSupabaseClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recovery_update');
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Setup fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  // Reset fields
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const { user } = await api.loginAdmin({ identifier, password });
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await api.setupAdmin({
        name,
        username,
        email,
        password,
        recoveryCode,
      });
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create administrator account.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);
    try {
      const res = await api.resetAdminPassword({
        identifier,
        recoveryCode,
        newPassword,
      });
      setInfoMessage(res.message);
      setPassword('');
      setNewPassword('');
      setRecoveryCode('');
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRecovery = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.completeRecoveryPassword(newPassword);
      setInfoMessage('Password updated successfully. Please sign in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181615] text-[#FAF7F2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[#221F1D] border border-white/10 p-7 sm:p-9 shadow-2xl">
        <div className="flex flex-col items-center text-center pb-6 border-b border-white/10">
          <BrandLogo variant="light" />
          <p className="mt-4 text-xs font-medium tracking-[0.2em] uppercase text-[#C8A45D]">
            {mode === 'setup'
              ? 'Initial Administrator Setup'
              : mode === 'reset' || mode === 'recovery_update'
                ? 'Password Recovery'
                : 'Administrator Sign In'}
          </p>
        </div>

        {error && (
          <div role="alert" className="mt-5 p-3.5 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-200">
            {error}
          </div>
        )}
        {infoMessage && (
          <div className="mt-5 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
            {infoMessage}
          </div>
        )}

        {mode === 'setup' && (
          <form onSubmit={handleSetup} className="mt-6 space-y-4">
            <p className="text-xs text-[#C8C0B4] leading-relaxed">
              Create the primary administrator account for Royal Furnishing. Keep your recovery passkey safe for future
              password resets.
            </p>
            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Administrator Name"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#D6CFC4] mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#D6CFC4] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@company.com"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1">Password (min 8 characters)</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1">
                Recovery Passkey (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="Private recovery key for password resets"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Create Administrator Account</span>
            </button>
          </form>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1.5">
                {isSupabaseMode ? 'Administrator Email' : 'Email or Username'}
              </label>
              <input
                type={isSupabaseMode ? 'email' : 'text'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isSupabaseMode ? 'admin@yourdomain.com' : 'admin or email@domain.com'}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#C8A45D]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#C8A45D]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Sign In to Dashboard</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfoMessage(null);
                  setMode('reset');
                }}
                className="text-xs text-[#C8A45D] hover:text-[#E6CE97] underline-offset-4 hover:underline cursor-pointer"
              >
                {isSupabaseMode ? 'Forgot Password?' : 'Forgot password? Reset with recovery passkey'}
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            {isSupabaseMode && (
              <p className="text-xs text-[#C8C0B4] leading-relaxed">
                Enter your registered administrator email address and we will send a secure password recovery link to your inbox.
              </p>
            )}
            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1.5">
                {isSupabaseMode ? 'Registered Administrator Email' : 'Admin Email or Username'}
              </label>
              <input
                type={isSupabaseMode ? 'email' : 'text'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isSupabaseMode ? 'admin@yourdomain.com' : undefined}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#C8A45D]"
              />
            </div>
            {!isSupabaseMode && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#D6CFC4] mb-1.5">Recovery Passkey</label>
                  <input
                    type="password"
                    required
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#D6CFC4] mb-1.5">New Password (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>{isSupabaseMode ? 'Send Reset Email' : 'Reset Password'}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="text-xs text-[#C8C0B4] hover:text-white cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'recovery_update' && (
          <form onSubmit={handleCompleteRecovery} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1.5">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#D6CFC4] mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white focus:outline-none focus:border-[#C8A45D]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Save New Password</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
