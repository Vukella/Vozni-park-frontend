import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { registrationServiceApi } from '../../api/endpoints';

export function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your work email address.');
            return;
        }

        setIsSubmitting(true);
        try {
            await registrationServiceApi.register(email.trim());
            navigate('/verify-email');
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response: { status: number; data?: { error?: string } } }).response;
                if (response.status === 404) {
                    setError('Email not found in the employee database. Contact your administrator.');
                } else if (response.status === 409) {
                    setError('This email is already registered. Please sign in instead.');
                } else {
                    setError(response.data?.error ?? 'Registration failed. Please try again.');
                }
            } else {
                setError('Unable to connect to the registration service.');
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

                <div className="card p-6">
                    <h2 className="mb-2 text-center text-lg font-semibold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mb-6 text-center text-sm text-gray-500">
                        Enter your work email to get started
                    </p>

                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                Work Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="your.name@voznipark.rs"
                                autoComplete="email"
                                autoFocus
                                disabled={isSubmitting}
                            />
                        </div>

                        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Mail className="h-4 w-4" />
                            )}
                            {isSubmitting ? 'Sending link...' : 'Send magic link'}
                        </button>
                    </form>
                </div>

                <div className="mt-4 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Back to sign in
                    </Link>
                </div>

                <p className="mt-4 text-center text-xs text-gray-400">
                    Vozni Park Fleet Management &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}