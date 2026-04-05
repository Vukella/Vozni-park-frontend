import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export function VerifyEmailPage() {
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

                <div className="card p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="mb-2 text-lg font-semibold text-gray-900">Check your email</h2>
                    <p className="mb-6 text-sm text-gray-500">
                        We sent a magic link to your work email. Click the link to continue your registration.
                    </p>
                    <div className="rounded-lg bg-amber-50 p-3 text-left text-xs text-amber-800">
                        <p className="mb-1 font-medium">Tip — link not working?</p>
                        <p>
                            Open the email in Mailtrap, go to the <span className="font-medium">HTML Source</span> tab,
                            and copy the token from the URL manually.
                        </p>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Didn't receive it? Try again
                    </Link>
                </div>

                <p className="mt-4 text-center text-xs text-gray-400">
                    Vozni Park Fleet Management &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}