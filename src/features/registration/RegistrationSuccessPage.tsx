import { Link } from 'react-router-dom';
import { CheckCircle, LogIn } from 'lucide-react';

export function RegistrationSuccessPage() {
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
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="mb-2 text-lg font-semibold text-gray-900">Account created!</h2>
                    <p className="mb-6 text-sm text-gray-500">
                        Your account has been successfully created. An administrator will assign your location
                        access — you will be able to sign in after that.
                    </p>
                    <Link to="/login" className="btn-primary inline-flex w-full justify-center">
                        <LogIn className="h-4 w-4" />
                        Go to sign in
                    </Link>
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Vozni Park Fleet Management &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}