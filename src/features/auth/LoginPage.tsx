import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { LogIn, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const { login, verifyOtp, isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(username.trim(), password);
      if (result === 'OTP_REQUIRED') {
        setStep('otp');
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status === 401) setError('Invalid username or password.');
      else if (status === 403) setError('2FA nije dostupan za ovaj nalog. Kontaktirajte administratora.');
      else setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(otp.trim());
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status === 401) setError('Neispravan ili istekao kod. Pokušajte ponovo.');
      else setError('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg">
              VP
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vozni Park</h1>
            <p className="mt-1 text-sm text-gray-500">Fleet Management System</p>
          </div>

          <div className="card p-6">
            {step === 'credentials' ? (
                <>
                  <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
                    Sign in to your account
                  </h2>

                  {error && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                  )}

                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="input-field"
                          placeholder="Enter your username"
                          autoComplete="username"
                          autoFocus
                          disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field pr-10"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isSubmitting}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                      {isSubmitting
                          ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          : <LogIn className="h-4 w-4" />}
                      {isSubmitting ? 'Signing in...' : 'Sign in'}
                    </button>
                  </form>

                  <div className="mt-4 border-t border-gray-100 pt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Don't have an account?{' '}
                      <Link to="/register" className="font-medium text-blue-600 hover:text-blue-800">
                        Register
                      </Link>
                    </p>
                  </div>
                </>
            ) : (
                <>
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                      <ShieldCheck className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Verifikacija identiteta</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Unesite kod koji smo poslali na Vašu email adresu
                    </p>
                  </div>

                  {error && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                  )}

                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="otp" className="mb-1 block text-sm font-medium text-gray-700">
                        Verifikacioni kod
                      </label>
                      <input
                          id="otp"
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="input-field text-center text-2xl tracking-widest"
                          placeholder="000000"
                          autoFocus
                          maxLength={6}
                          disabled={isSubmitting}
                      />
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={isSubmitting || otp.length !== 6}>
                      {isSubmitting
                          ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          : <ShieldCheck className="h-4 w-4" />}
                      {isSubmitting ? 'Verifying...' : 'Potvrdi'}
                    </button>

                    <button
                        type="button"
                        onClick={() => { setStep('credentials'); setError(''); setOtp(''); }}
                        className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Nazad na prijavu
                    </button>
                  </form>
                </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Vozni Park Fleet Management &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
  );
}