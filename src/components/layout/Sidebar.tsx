import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  MapPin,
  Tag,
  Fuel,
  Shield,
  CreditCard,
  IdCard,
  Cross,
  ChevronLeft,
  ChevronRight,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
  group: string;
}

const navItems: NavItem[] = [
  // Main
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, group: 'Main' },

  // Core
  { label: 'Vehicles', path: '/vehicles', icon: Car, group: 'Fleet Management' },
  { label: 'Drivers', path: '/drivers', icon: Users, group: 'Fleet Management' },
  { label: 'Travel Orders', path: '/travel-orders', icon: FileText, group: 'Fleet Management' },

  // Organization
  { label: 'Locations', path: '/locations', icon: MapPin, group: 'Organization' },
  { label: 'Users', path: '/users', icon: Shield, superAdminOnly: true, group: 'Organization' },
  { label: 'Roles', path: '/roles', icon: Shield, superAdminOnly: true, group: 'Organization' },

  // Reference Data
  { label: 'Brands', path: '/brands', icon: Tag, group: 'Reference Data' },
  { label: 'Vehicle Models', path: '/vehicle-models', icon: Car, group: 'Reference Data' },
  { label: 'Fuel Types', path: '/fuel-types', icon: Fuel, group: 'Reference Data' },

  // Safety & Compliance
  { label: 'Registrations', path: '/registrations', icon: CreditCard, group: 'Safety & Compliance' },
  { label: 'Drivers Licenses', path: '/drivers-licenses', icon: IdCard, group: 'Safety & Compliance' },
  { label: 'First Aid Kits', path: '/first-aid-kits', icon: Cross, group: 'Safety & Compliance' },
];

export function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const { isSuperAdmin } = useAuth();

  const filteredItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  const groups = filteredItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={`flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            VP
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-gray-900">Vozni Park</span>
          )}
        </div>
        {/* Mobile close button */}
        {onMobileClose && !collapsed && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {groupName}
              </p>
            )}
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden border-t border-gray-200 p-2 lg:block">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
