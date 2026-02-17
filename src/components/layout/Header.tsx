import { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, isSuperAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMobileMenuToggle}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-gray-900 sm:text-lg">
          Fleet Management System
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role badge */}
        <span
          className={`badge hidden sm:inline-flex ${
            isSuperAdmin ? 'badge-blue' : 'badge-green'
          }`}
        >
          {user?.role?.replace('_', ' ')}
        </span>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 sm:px-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <span className="hidden font-medium sm:block">{user?.fullName}</span>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
                {/* Show role on mobile in dropdown */}
                <p className="mt-1 sm:hidden">
                  <span className={`badge ${isSuperAdmin ? 'badge-blue' : 'badge-green'}`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                </p>
              </div>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
