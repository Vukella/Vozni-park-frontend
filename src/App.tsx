import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout, ToastProvider, ErrorBoundary, NotFoundPage } from './components';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { VehiclesPage } from './features/vehicles/VehiclesPage';
import { DriversPage } from './features/drivers/DriversPage';
import { TravelOrdersPage } from './features/travel-orders/TravelOrdersPage';
import { UsersPage } from './features/users/UsersPage';
import { LocationsPage } from './features/locations/LocationsPage';
import { RolesPage } from './features/roles/RolesPage';
import { BrandsPage } from './features/brands/BrandsPage';
import { VehicleModelsPage } from './features/vehicle-models/VehicleModelsPage';
import { FuelTypesPage } from './features/fuel-types/FuelTypesPage';
import { RegistrationsPage } from './features/registrations/RegistrationsPage';
import { DriversLicensesPage } from './features/drivers-licenses/DriversLicensesPage';
import { FirstAidKitsPage } from './features/first-aid-kits/FirstAidKitsPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<DashboardPage />} />

                  {/* Core entities */}
                  <Route path="/vehicles" element={<VehiclesPage />} />
                  <Route path="/drivers" element={<DriversPage />} />
                  <Route path="/travel-orders" element={<TravelOrdersPage />} />

                  {/* Organization */}
                  <Route path="/locations" element={<LocationsPage />} />

                  {/* SUPER_ADMIN only routes */}
                  <Route element={<ProtectedRoute requiredRole="SUPER_ADMIN" />}>
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/roles" element={<RolesPage />} />
                  </Route>

                  {/* Reference data */}
                  <Route path="/brands" element={<BrandsPage />} />
                  <Route path="/vehicle-models" element={<VehicleModelsPage />} />
                  <Route path="/fuel-types" element={<FuelTypesPage />} />

                  {/* Safety & Compliance */}
                  <Route path="/registrations" element={<RegistrationsPage />} />
                  <Route path="/drivers-licenses" element={<DriversLicensesPage />} />
                  <Route path="/first-aid-kits" element={<FirstAidKitsPage />} />

                  {/* 404 catch-all */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
