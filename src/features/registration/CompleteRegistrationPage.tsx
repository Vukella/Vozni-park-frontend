import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { registrationServiceApi } from '../../api/endpoints';

type Step = 'verifying' | 'form' | 'error';

export function CompleteRegistrationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const [step, setStep] = useState<Step>('verifying');
    const [linkError, setLinkError] = useState('');

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (!token) {
            setLinkError('Invalid or missing registration link. Please request a new one.');
            setStep('error');
            return;
        }

        registrationServiceApi.verify(token)
            .then(() => setStep('form'))
            .catch((err: unknown) => {
                if (typeof err === 'object' && err !== null && 'response' in err) {
                    const res = (err as { response: { status: number } }).response;
                    if (res.status === 410) {
                        setLinkError('This link has expired. Please request a new registration link.');
                    } else if (res.status === 404) {
                        setLinkError('Invalid registration link. Please request a new one.');
                    } else {
                        setLinkError('Could not validate your link. Please try again.');
                    }
                } else {
                    setLinkError('Unable to connect to the registration service.');
                }
                setStep('error');
            });
    }, [token]);

    async function handleComplete(e: FormEvent) {
        e.preventDefault();
        setFormError('');

        if (!username.trim() || !password.trim()) {
            setFormError('All fields are required.');
            return;
        }
        if (password !== confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setFormError('Password must be at least 8 characters.');
            return;
        }

        setIsSubmitting(true);
        try {
            await registrationServiceApi.complete(token, username.trim(), password);
            navigate('/registration-success');
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const res = (err as { response: { status: number; data?: { error?: string } } }).response;
                if (res.status === 409) {
                    setFormError('Username already taken. Please choose a different one.');
                } else if (res.status === 410) {
                    setLinkError('This link has expired. Please request a new one.');
                    setStep('error');
                } else {
                    setFormError(res.data?.error ?? 'Registration failed. Please try again.');
                }
            } else {
                setFormError('Unable to connect to the registration service.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg">
                        VP
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Vozni Park</h1>
                    <p className="mt-1 text-sm text-gray-500">Fleet Management System</p>
                </div>

                <div className="card p-6">

                    {step === 'verifying' && (
                        <div className="flex flex-col items-center gap-3 py-6">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            <p className="text-sm text-gray-500">Validating your link...</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h2 className="mb-2 text-lg font-semibold text-gray-900">Link invalid</h2>
                            <p className="mb-6 text-sm text-gray-500">{linkError}</p>
                            <Link to="/register" className="btn-primary inline-flex w-full justify-center">
                                Request new link
                            </Link>
                        </div>
                    )}

                    {step === 'form' && (
                        <>
                            <div className="mb-6 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900">Email verified!</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Choose your username and password to complete registration.
                                </p>
                            </div>

                            {formError && (
                                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <form onSubmit={handleComplete} className="space-y-4">
                                <div>
                                    <label htmlFor="reg-username" className="mb-1 block text-sm font-medium text-gray-700">
                                        Username
                                    </label>
                                    <input
                                        id="reg-username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="input-field"
                                        placeholder="Choose a username"
                                        autoComplete="username"
                                        autoFocus
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="reg-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="input-field pr-10"
                                            placeholder="Min. 8 characters"
                                            autoComplete="new-password"
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

                                <div>
                                    <label htmlFor="reg-confirm" className="mb-1 block text-sm font-medium text-gray-700">
                                        Confirm Password
                                    </label>
                                    <input
                                        id="reg-confirm"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-field"
                                        placeholder="Repeat your password"
                                        autoComplete="new-password"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
                                    {isSubmitting
                                        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        : <KeyRound className="h-4 w-4" />}
                                    {isSubmitting ? 'Creating account...' : 'Create account'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                {step !== 'verifying' && (
                    <div className="mt-4 text-center">
                        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                            <ArrowLeft className="h-3 w-3" />
                            Back to sign in
                        </Link>
                    </div>
                )}

                <p className="mt-4 text-center text-xs text-gray-400">
                    Vozni Park Fleet Management &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}