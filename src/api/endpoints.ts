import apiClient from './client';
import type {
  LoginRequest,
  LoginResponse,
  VehicleResponse,
  VehicleRequest,
  DriverResponse,
  DriverRequest,
  TravelOrderResponse,
  TravelOrderRequest,
  AppUserResponse,
  AppUserRequest,
  BrandResponse,
  VehicleModelResponse,
  LocationUnitResponse,
  FuelType,
  Role,
  Registration,
  DriversLicense,
  FirstAidKit,
  LicenseCategory,
  VehicleLocation,
  DriverLocation,
} from '../types';

// ============================================
// Auth
// ============================================

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),
};

// ============================================
// Vehicles
// ============================================

export const vehicleApi = {
  getAll: () =>
    apiClient.get<VehicleResponse[]>('/vehicles'),

  getById: (id: number) =>
    apiClient.get<VehicleResponse>(`/vehicles/${id}`),

  getByLocation: (locationId: number) =>
    apiClient.get<VehicleResponse[]>(`/vehicles/location/${locationId}`),

  getAvailable: () =>
    apiClient.get<VehicleResponse[]>('/vehicles/available'),

  create: (data: VehicleRequest) =>
    apiClient.post<VehicleResponse>('/vehicles', data),

  update: (id: number, data: VehicleRequest) =>
    apiClient.put<VehicleResponse>(`/vehicles/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/vehicles/${id}`),
};

// ============================================
// Drivers
// ============================================

export const driverApi = {
  getAll: () =>
    apiClient.get<DriverResponse[]>('/drivers'),

  getById: (id: number) =>
    apiClient.get<DriverResponse>(`/drivers/${id}`),

  getAvailable: () =>
    apiClient.get<DriverResponse[]>('/drivers/available'),

  getByStatus: (status: string) =>
    apiClient.get<DriverResponse[]>(`/drivers/status/${status}`),

  search: (name: string) =>
    apiClient.get<DriverResponse[]>(`/drivers/search?name=${encodeURIComponent(name)}`),

  create: (data: DriverRequest) =>
    apiClient.post<DriverResponse>('/drivers', data),

  update: (id: number, data: DriverRequest) =>
    apiClient.put<DriverResponse>(`/drivers/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/drivers/${id}`),
};

// ============================================
// Travel Orders
// ============================================

export const travelOrderApi = {
  getAll: () =>
    apiClient.get<TravelOrderResponse[]>('/travel-orders'),

  getById: (id: number) =>
    apiClient.get<TravelOrderResponse>(`/travel-orders/${id}`),

  getByStatus: (status: string) =>
    apiClient.get<TravelOrderResponse[]>(`/travel-orders/status/${status}`),

  getByDriver: (driverId: number) =>
    apiClient.get<TravelOrderResponse[]>(`/travel-orders/driver/${driverId}`),

  getByVehicle: (vehicleId: number) =>
    apiClient.get<TravelOrderResponse[]>(`/travel-orders/vehicle/${vehicleId}`),

  getByDateRange: (startDate: string, endDate: string) =>
    apiClient.get<TravelOrderResponse[]>(
      `/travel-orders/date-range?startDate=${startDate}&endDate=${endDate}`
    ),

  create: (data: TravelOrderRequest) =>
    apiClient.post<TravelOrderResponse>('/travel-orders', data),

  update: (id: number, data: TravelOrderRequest) =>
    apiClient.put<TravelOrderResponse>(`/travel-orders/${id}`, data),

  complete: (id: number, endingMileage: number) =>
    apiClient.patch<TravelOrderResponse>(
      `/travel-orders/${id}/complete`,
      null,
      { params: { endingMileage } }
    ),

  cancel: (id: number) =>
    apiClient.patch<TravelOrderResponse>(`/travel-orders/${id}/cancel`),

  delete: (id: number) =>
    apiClient.delete(`/travel-orders/${id}`),
};

// ============================================
// Users
// ============================================

export const userApi = {
  getAll: () =>
    apiClient.get<AppUserResponse[]>('/users'),

  getById: (id: number) =>
    apiClient.get<AppUserResponse>(`/users/${id}`),

  create: (data: AppUserRequest) =>
    apiClient.post<AppUserResponse>('/users', data),

  update: (id: number, data: AppUserRequest) =>
    apiClient.put<AppUserResponse>(`/users/${id}`, data),

  updatePassword: (id: number, newPassword: string) =>
    apiClient.patch(`/users/${id}/password`, null, { params: { newPassword } }),

  delete: (id: number) =>
    apiClient.delete(`/users/${id}`),
};

// ============================================
// Brands
// ============================================

export const brandApi = {
  getAll: () =>
    apiClient.get<BrandResponse[]>('/brands'),

  getById: (id: number) =>
    apiClient.get<BrandResponse>(`/brands/${id}`),

  create: (data: { brandName: string }) =>
    apiClient.post<BrandResponse>('/brands', data),

  update: (id: number, data: { brandName: string }) =>
    apiClient.put<BrandResponse>(`/brands/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/brands/${id}`),
};

// ============================================
// Vehicle Models
// ============================================

export const vehicleModelApi = {
  getAll: () =>
    apiClient.get<VehicleModelResponse[]>('/vehicle-models'),

  getByBrand: (brandId: number) =>
    apiClient.get<VehicleModelResponse[]>(`/vehicle-models/brand/${brandId}`),

  create: (data: { modelName: string; brandId: number }) =>
    apiClient.post<VehicleModelResponse>('/vehicle-models', data),

  update: (id: number, data: { modelName: string; brandId: number }) =>
    apiClient.put<VehicleModelResponse>(`/vehicle-models/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/vehicle-models/${id}`),
};

// ============================================
// Locations
// ============================================

export const locationApi = {
  getAll: () =>
    apiClient.get<LocationUnitResponse[]>('/locations'),

  getById: (id: number) =>
    apiClient.get<LocationUnitResponse>(`/locations/${id}`),

  create: (data: { locationName: string; address?: string; city?: string }) =>
    apiClient.post<LocationUnitResponse>('/locations', data),

  update: (id: number, data: { locationName: string; address?: string; city?: string }) =>
    apiClient.put<LocationUnitResponse>(`/locations/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/locations/${id}`),
};

// ============================================
// Fuel Types
// ============================================

export const fuelTypeApi = {
  getAll: () =>
    apiClient.get<FuelType[]>('/fuel-types'),

  create: (data: { fuelName: string }) =>
    apiClient.post<FuelType>('/fuel-types', data),

  update: (id: number, data: { fuelName: string }) =>
    apiClient.put<FuelType>(`/fuel-types/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/fuel-types/${id}`),
};

// ============================================
// Roles
// ============================================

export const roleApi = {
  getAll: () =>
    apiClient.get<Role[]>('/roles'),

  create: (data: { name: string }) =>
    apiClient.post<Role>('/roles', data),

  delete: (id: number) =>
    apiClient.delete(`/roles/${id}`),
};

// ============================================
// Registrations
// ============================================

export const registrationApi = {
  getAll: () =>
    apiClient.get<Registration[]>('/registrations'),

  getByVehicle: (vehicleId: number) =>
    apiClient.get<Registration>(`/registrations/vehicle/${vehicleId}`),

  create: (data: Omit<Registration, 'idRegistration'>) =>
    apiClient.post<Registration>('/registrations', data),

  update: (id: number, data: Omit<Registration, 'idRegistration'>) =>
    apiClient.put<Registration>(`/registrations/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/registrations/${id}`),
};

// ============================================
// Drivers Licenses
// ============================================

export const driversLicenseApi = {
  getAll: () =>
    apiClient.get<DriversLicense[]>('/drivers-licenses'),

  getByDriver: (driverId: number) =>
    apiClient.get<DriversLicense>(`/drivers-licenses/driver/${driverId}`),

  create: (data: Omit<DriversLicense, 'idDriversLicense'>) =>
    apiClient.post<DriversLicense>('/drivers-licenses', data),

  update: (id: number, data: Omit<DriversLicense, 'idDriversLicense'>) =>
    apiClient.put<DriversLicense>(`/drivers-licenses/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/drivers-licenses/${id}`),
};

// ============================================
// First Aid Kits
// ============================================

export const firstAidKitApi = {
  getAll: () =>
    apiClient.get<FirstAidKit[]>('/first-aid-kits'),

  getByVehicle: (vehicleId: number) =>
    apiClient.get<FirstAidKit>(`/first-aid-kits/vehicle/${vehicleId}`),

  create: (data: Omit<FirstAidKit, 'idFirstAidKit'>) =>
    apiClient.post<FirstAidKit>('/first-aid-kits', data),

  update: (id: number, data: Omit<FirstAidKit, 'idFirstAidKit'>) =>
    apiClient.put<FirstAidKit>(`/first-aid-kits/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/first-aid-kits/${id}`),
};

// ============================================
// License Categories
// ============================================

export const licenseCategoryApi = {
  getAll: () =>
    apiClient.get<LicenseCategory[]>('/license-categories'),

  create: (data: { categoryName: string }) =>
    apiClient.post<LicenseCategory>('/license-categories', data),

  delete: (id: number) =>
    apiClient.delete(`/license-categories/${id}`),
};

// ============================================
// Vehicle Locations (assignments)
// ============================================

export const vehicleLocationApi = {
  getAll: () =>
    apiClient.get<VehicleLocation[]>('/vehicle-locations'),

  assign: (vehicleId: number, locationUnitId: number) =>
    apiClient.post<VehicleLocation>('/vehicle-locations', null, {
      params: { vehicleId, locationUnitId },
    }),

  update: (id: number, locationUnitId: number) =>
    apiClient.put<VehicleLocation>(`/vehicle-locations/${id}`, null, {
      params: { locationUnitId },
    }),

  delete: (id: number) =>
    apiClient.delete(`/vehicle-locations/${id}`),
};

// ============================================
// Driver Locations (assignments)
// ============================================

export const driverLocationApi = {
  getAll: () =>
    apiClient.get<DriverLocation[]>('/driver-locations'),

  assign: (driverId: number, locationUnitId: number) =>
    apiClient.post<DriverLocation>('/driver-locations', null, {
      params: { driverId, locationUnitId },
    }),

  update: (id: number, locationUnitId: number) =>
    apiClient.put<DriverLocation>(`/driver-locations/${id}`, null, {
      params: { locationUnitId },
    }),

  delete: (id: number) =>
    apiClient.delete(`/driver-locations/${id}`),
};
