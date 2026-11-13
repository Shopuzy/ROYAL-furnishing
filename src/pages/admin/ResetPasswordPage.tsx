import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';
import { isSupabaseMode } from '../../lib/api';
import { usePageMeta } from '../../lib/seo';
import { getSupabaseClient } from '../../lib/supabase';

type RecoveryCheckState = 'verifying' | 'ready' | 'invalid';

export function ResetPasswordPage() {
  usePageMeta({
    title: 'Reset Password – Royal Furnishing Admin',
    description: 'Verify recovery session and set a new Royal Furnishing administrator password.',
  });

  const navigate = useNavigate();
  const redirectTimerRef = useRef<number | null>(null);

  const [sessionState, setSessionState] = useState<RecoveryCheckState>('verifying');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseMode) {
      setSessionState('invalid');
      setError('Supabase Authentication is not configured in this environment.');
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseClient();

    // Check if Supabase redirected back with an error in query or hash
    const searchParams = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);

    const urlErrorDesc = searchParams.get('error_description') || hashParams.get('error_description');
    if (urlErrorDesc) {
      setSessionState('invalid');
      setError(urlErrorDesc.replace(/\+/g, ' '));
      return;
    }

    const markReady = (email?: string | null) => {
      if (cancelled) return;
      if (email) setVerifiedEmail(email);
      setError(null);
      setSessionState('ready');
    };

    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session)) {
        markReady(session?.user?.email);
      }
    });

    const verifyRecovery = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const otpType = searchParams.get('type');
        const pkceCode = searchParams.get('code');
        const hasRecoveryParams =
          Boolean(tokenHash) ||
          Boolean(pkceCode) ||
          hashParams.get('type') === 'recovery' ||
          Boolean(hashParams.get('access_token'));

        // Handle explicit token_hash OTP recovery links
        if (tokenHash && otpType === 'recovery') {
          const { data, error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (verifyErr) {
            if (!cancelled) {
              setSessionState('invalid');
              setError(verifyErr.message || 'Recovery link is invalid or has expired.');
            }
            return;
          }
          if (data.session) {
            markReady(data.session.user?.email);
            return;
          }
        }

        // Check current session (detectSessionInUrl exchanges PKCE code or parses hash automatically)
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          if (!cancelled) {
            setSessionState('invalid');
            setError(sessionErr.message);
          }
          return;
        }

        if (sessionData.session) {
          markReady(sessionData.session.user?.email);
          return;
        }

        // Wait briefly for URL session exchange if recovery params were present
        if (hasRecoveryParams) {
          await new Promise((resolve) => window.setTimeout(resolve, 1400));
          if (cancelled) return;
          const { data: retryData } = await supabase.auth.getSession();
          if (retryData.session) {
            markReady(retryData.session.user?.email);
            return;
          }
        }

        if (!cancelled) {
          setSessionState((prev) => {
            if (prev === 'ready') return prev;
            setError('Your password reset link is invalid, incomplete, or has expired. Please request a new reset email.');
            return 'invalid';
          });
        }
      } catch (err) {
        if (!cancelled) {
          setSessionState('invalid');
          setError(err instanceof Error ? err.message : 'Failed to verify password recovery session.');
        }
      }
    };

    verifyRecovery();

    return () => {
      cancelled = true;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setError(updateErr.message || 'Unable to update password.');
        setSubmitting(false);
        return;
      }

      // Clear recovery session so admin signs in cleanly on the login page
      await supabase.auth.signOut().catch(() => {});

      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password updated successfully. Redirecting to the administrator sign-in page...');

      redirectTimerRef.current = window.setTimeout(() => {
        navigate('/admin', {
          replace: true,
          state: { passwordResetSuccess: true },
        });
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181615] text-[#FAF7F2] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[#221F1D] border border-white/10 p-7 sm:p-9 shadow-2xl">
        <div className="flex flex-col items-center text-center pb-6 border-b border-white/10">
          <BrandLogo variant="light" />
          <p className="mt-4 text-xs font-medium tracking-[0.2em] uppercase text-[#C8A45D]">
            Administrator Password Reset
          </p>
        </div>

        {sessionState === 'verifying' && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#C8A45D]" />
            <p className="text-sm text-[#D6CFC4]">Verifying your password recovery session...</p>
          </div>
        )}

        {sessionState === 'invalid' && (
          <div className="mt-6 space-y-5">
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start gap-3 text-xs text-red-200 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error || 'Invalid or expired password recovery link.'}</span>
            </div>

            <Link
              to="/admin"
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Sign In</span>
            </Link>
          </div>
        )}

        {sessionState === 'ready' && (
          <div className="mt-6">
            {verifiedEmail && !successMessage && (
              <p className="mb-4 text-xs text-[#C8C0B4] text-center">
                Setting new password for <span className="text-[#E6CE97] font-medium">{verifiedEmail}</span>
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="mb-4 p-3.5 rounded-lg bg-red-950/60 border border-red-500/40 flex items-start gap-2.5 text-xs text-red-200"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-start gap-3 text-xs text-emerald-200 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>

                <Link
                  to="/admin"
                  state={{ passwordResetSuccess: true }}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] text-[#181615] text-sm font-semibold transition-colors"
                >
                  <span>Proceed to Admin Login</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-xs font-medium text-[#D6CFC4] mb-1.5">
                    New Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#C8A45D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A89F91] hover:text-white cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-medium text-[#D6CFC4] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-lg bg-[#181615] border border-white/15 text-sm text-white placeholder:text-[#78716C] focus:outline-none focus:border-[#C8A45D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A89F91] hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C8A45D] hover:bg-[#B89249] disabled:opacity-60 text-[#181615] text-sm font-semibold transition-colors cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Update Password</span>
                </button>

                <div className="pt-2 text-center">
                  <Link to="/admin" className="text-xs text-[#C8C0B4] hover:text-white">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
