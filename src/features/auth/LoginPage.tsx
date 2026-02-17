import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as Record<string, unknown>).response === 'object'
      ) {
        const response = (err as { response: { status: number } }).response;
        if (response.status === 401) {
          setError('Invalid username or password.');
        } else if (response.status === 403) {
          setError('Account is deactivated. Please contact an administrator.');
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError('Unable to connect to server. Please check your connection.');
      }
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

        {/* Login Card */}
        <div className="card p-6">
          <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
            Sign in to your account
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
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

            {/* Password */}
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

            {/* Submit */}
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Vozni Park Fleet Management &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
