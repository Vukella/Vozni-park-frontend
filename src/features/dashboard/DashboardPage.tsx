import { useEffect, useState } from 'react';
import {
  Car,
  Users,
  FileText,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { vehicleApi, driverApi, travelOrderApi, locationApi } from '../../api/endpoints';
import { StatusBadge } from '../../components';
import { formatDate } from '../../utils/format';
import type { VehicleResponse, DriverResponse, TravelOrderResponse, LocationUnitResponse } from '../../types';

// ============================================
// Types
// ============================================

interface DashboardData {
  vehicles: VehicleResponse[];
  drivers: DriverResponse[];
  travelOrders: TravelOrderResponse[];
  locations: LocationUnitResponse[];
}

// ============================================
// Component
// ============================================

export function DashboardPage() {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [vehicles, drivers, orders, locations] = await Promise.all([
          vehicleApi.getAll(),
          driverApi.getAll(),
          travelOrderApi.getAll(),
          locationApi.getAll(),
        ]);
        setData({
          vehicles: vehicles.data,
          drivers: drivers.data,
          travelOrders: orders.data,
          locations: locations.data,
        });
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm text-gray-600">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">
            Retry
          </button>
        </div>
    );
  }

  if (!data) return null;

  // Compute stats
  const activeVehicles = data.vehicles.filter((v) => v.vehicleStatus === 'Active').length;
  const inactiveVehicles = data.vehicles.length - activeVehicles;
  const activeDrivers = data.drivers.filter((d) => d.status === 'Active').length;
  const activeOrders = data.travelOrders.filter((o) => o.status === 'IN_PROGRESS').length;
  const createdOrders = data.travelOrders.filter((o) => o.status === 'CREATED').length;
  const completedOrders = data.travelOrders.filter((o) => o.status === 'COMPLETED').length;

  // Recent travel orders (last 5)
  const recentOrders = [...data.travelOrders]
      .sort((a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime())
      .slice(0, 5);

  // Vehicles by status for breakdown
  const vehicleStatusMap = data.vehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.vehicleStatus] = (acc[v.vehicleStatus] || 0) + 1;
    return acc;
  }, {});

  // Travel order status breakdown
  const orderStatusMap = data.travelOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  return (
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.fullName}
            {!isSuperAdmin && ' — showing data for your assigned locations'}
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard
              label="Total Vehicles"
              value={data.vehicles.length}
              subtitle={`${activeVehicles} active, ${inactiveVehicles} inactive`}
              icon={Car}
              color="blue"
              onClick={() => navigate('/vehicles')}
          />
          <StatCard
              label="Total Drivers"
              value={data.drivers.length}
              subtitle={`${activeDrivers} active`}
              icon={Users}
              color="emerald"
              onClick={() => navigate('/drivers')}
          />
          <StatCard
              label="Active Orders"
              value={activeOrders + createdOrders}
              subtitle={`${activeOrders} in progress, ${createdOrders} created`}
              icon={TrendingUp}
              color="amber"
              onClick={() => navigate('/travel-orders')}
          />
          <StatCard
              label="Completed Orders"
              value={completedOrders}
              subtitle={`of ${data.travelOrders.length} total`}
              icon={CheckCircle}
              color="purple"
              onClick={() => navigate('/travel-orders')}
          />
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
          {/* Recent Travel Orders */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Recent Travel Orders</h2>
              <button
                  onClick={() => navigate('/travel-orders')}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {recentOrders.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                  No travel orders yet.
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                      <div
                          key={order.idTravelOrder}
                          className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => navigate('/travel-orders')}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <FileText className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {order.travelOrderNumber}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {order.destination || 'No destination'} · {formatDate(order.departureDate)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                  ))}
                </div>
            )}
          </div>

          {/* Fleet Overview */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Fleet Overview</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Vehicle breakdown */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Vehicles by Status
                </p>
                {Object.entries(vehicleStatusMap).length === 0 ? (
                    <p className="text-sm text-gray-400">No vehicles</p>
                ) : (
                    <div className="space-y-2">
                      {Object.entries(vehicleStatusMap).map(([status, count]) => (
                          <BreakdownBar
                              key={status}
                              label={status}
                              count={count}
                              total={data.vehicles.length}
                              status={status}
                          />
                      ))}
                    </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* Order breakdown */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Orders by Status
                </p>
                {Object.entries(orderStatusMap).length === 0 ? (
                    <p className="text-sm text-gray-400">No orders</p>
                ) : (
                    <div className="space-y-2">
                      {Object.entries(orderStatusMap).map(([status, count]) => (
                          <BreakdownBar
                              key={status}
                              label={status.replace(/_/g, ' ')}
                              count={count}
                              total={data.travelOrders.length}
                              status={status}
                          />
                      ))}
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Third row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Locations summary (SUPER_ADMIN) */}
          {isSuperAdmin && (
              <div className="card">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <h2 className="text-base font-semibold text-gray-900">Locations</h2>
                  <button
                      onClick={() => navigate('/locations')}
                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Manage <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {data.locations.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                      No locations configured.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                      {data.locations.map((loc) => (
                          <div key={loc.idLocationUnit} className="flex items-center justify-between px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                                <MapPin className="h-4 w-4 text-rose-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{loc.locationName}</p>
                                <p className="text-xs text-gray-500">{loc.city || loc.address || '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Car className="h-3.5 w-3.5" /> {loc.vehicleCount}
                      </span>
                              <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {loc.driverCount}
                      </span>
                            </div>
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6">
              <QuickAction
                  icon={FileText}
                  label="New Travel Order"
                  color="blue"
                  onClick={() => navigate('/travel-orders')}
              />
              <QuickAction
                  icon={Car}
                  label="Add Vehicle"
                  color="emerald"
                  onClick={() => navigate('/vehicles')}
              />
              <QuickAction
                  icon={Users}
                  label="Add Driver"
                  color="purple"
                  onClick={() => navigate('/drivers')}
              />
              <QuickAction
                  icon={Clock}
                  label="View Orders"
                  color="amber"
                  onClick={() => navigate('/travel-orders')}
              />
            </div>
          </div>
        </div>
      </div>
  );
}

// ============================================
// Sub-components
// ============================================

interface StatCardProps {
  label: string;
  value: number;
  subtitle: string;
  icon: typeof Car;
  color: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
  onClick?: () => void;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

function StatCard({ label, value, subtitle, icon: Icon, color, onClick }: StatCardProps) {
  const colors = colorMap[color];
  return (
      <div
          className={`card p-6 transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <div className={`rounded-lg p-2 ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      </div>
  );
}

interface BreakdownBarProps {
  label: string;
  count: number;
  total: number;
  status: string;
}

function BreakdownBar({ label, count, total, status }: BreakdownBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  const barColorMap: Record<string, string> = {
    Active: 'bg-green-500',
    Inactive: 'bg-red-400',
    CREATED: 'bg-yellow-400',
    IN_PROGRESS: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
    CANCELLED: 'bg-red-400',
  };
  const barColor = barColorMap[status] || 'bg-gray-400';

  return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600 capitalize">{label}</span>
          <span className="text-xs text-gray-400">{count}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
  );
}

interface QuickActionProps {
  icon: typeof Car;
  label: string;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
  onClick: () => void;
}

function QuickAction({ icon: Icon, label, color, onClick }: QuickActionProps) {
  const colors = colorMap[color];
  return (
      <button
          onClick={onClick}
          className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-sm"
      >
        <div className={`rounded-lg p-2.5 ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
        <span className="text-xs font-medium text-gray-700">{label}</span>
      </button>
  );
}

// ============================================
// Skeleton
// ============================================

function DashboardSkeleton() {
  return (
      <div>
        <div className="mb-6">
          <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card animate-pulse p-6">
                <div className="flex justify-between">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-9 w-9 rounded-lg bg-gray-200" />
                </div>
                <div className="mt-3 h-9 w-16 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-32 rounded bg-gray-200" />
              </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 card animate-pulse">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="h-5 w-40 rounded bg-gray-200" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3">
                  <div className="h-9 w-9 rounded-lg bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="mt-1 h-3 w-48 rounded bg-gray-200" />
                  </div>
                </div>
            ))}
          </div>
          <div className="card animate-pulse p-6">
            <div className="h-5 w-32 rounded bg-gray-200 mb-4" />
            {[1, 2, 3].map((i) => (
                <div key={i} className="mb-3">
                  <div className="h-3 w-24 rounded bg-gray-200 mb-1" />
                  <div className="h-2 w-full rounded-full bg-gray-200" />
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}
