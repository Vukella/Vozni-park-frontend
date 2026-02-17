// ============================================
// Summary DTOs (lightweight, for nested use)
// ============================================

export interface BrandSummary {
  idBrand: number;
  brandName: string;
}

export interface RoleSummary {
  idRole: number;
  name: string;
}

export interface LocationUnitSummary {
  idLocationUnit: number;
  locationName: string;
}

export interface FuelTypeSummary {
  idFuelType: number;
  fuelName: string;
}

export interface VehicleModelSummary {
  idVehicleModel: number;
  modelName: string;
}

export interface DriverSummary {
  idDriver: number;
  sapNumber: number;
  firstName: string;
  lastName: string;
}

export interface VehicleSummary {
  idVehicle: number;
  sapNumber: number;
  chassisNumber: string;
}

export interface AppUserSummary {
  idUser: number;
  username: string;
  fullName: string;
}

// ============================================
// Response DTOs (full detail, for GET responses)
// ============================================

export interface RegistrationInfo {
  idRegistration: number;
  registrationNumber: string;
  expirationDate: string;
}

export interface FirstAidKitInfo {
  idFirstAidKit: number;
  expirationDate: string;
}

export interface VehicleResponse {
  idVehicle: number;
  sapNumber: number;
  chassisNumber: string;
  registrationPlate: string | null;
  vehicleStatus: string;
  statusCode: number;
  yearOfManufacture: number | null;
  mileage: number | null;
  horsePower: number | null;
  kilowatts: number | null;
  displacement: number | null;
  numberOfDoors: number | null;
  numberOfSeats: number | null;
  maxSpeed: number | null;
  airConditioning: boolean | null;
  color: string | null;
  brand: BrandSummary | null;
  vehicleModel: VehicleModelSummary | null;
  fuelType: FuelTypeSummary | null;
  registration: RegistrationInfo | null;
  firstAidKit: FirstAidKitInfo | null;
  locationUnit: LocationUnitSummary | null;
}

export interface DriverLicenseInfo {
  idDriversLicense: number;
  licenseNumber: string;
  expirationDate: string;
  categories: string[];
}

export interface DriverResponse {
  idDriver: number;
  sapNumber: number;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  status: string;
  driversLicense: DriverLicenseInfo | null;
  locationUnit: LocationUnitSummary | null;
}

export interface TravelOrderResponse {
  idTravelOrder: number;
  travelOrderNumber: string;
  status: string;
  startingMileage: number;
  endingMileage: number | null;
  departureDate: string;
  returnDate: string | null;
  destination: string | null;
  purpose: string | null;
  notes: string | null;
  createdByUser: AppUserSummary | null;
  location: LocationUnitSummary | null;
  drivers: DriverSummary[];
  vehicles: VehicleSummary[];
}

export interface AppUserResponse {
  idUser: number;
  username: string;
  fullName: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lastFailedLogin: string | null;
  lastSuccessfulLogin: string | null;
  role: RoleSummary | null;
  locations: LocationUnitSummary[];
}

export interface BrandResponse {
  idBrand: number;
  brandName: string;
  vehicleModelCount: number;
}

export interface VehicleModelResponse {
  idVehicleModel: number;
  modelName: string;
  brand: BrandSummary | null;
}

export interface LocationUnitResponse {
  idLocationUnit: number;
  locationName: string;
  address: string | null;
  city: string | null;
  vehicleCount: number;
  driverCount: number;
  userCount: number;
}

// ============================================
// Request DTOs (for POST/PUT operations)
// ============================================

export interface VehicleRequest {
  sapNumber: number;
  chassisNumber: string;
  registrationPlate?: string;
  vehicleStatus: string;
  statusCode: number;
  yearOfManufacture?: number;
  mileage?: number;
  horsePower?: number;
  kilowatts?: number;
  displacement?: number;
  numberOfDoors?: number;
  numberOfSeats?: number;
  maxSpeed?: number;
  airConditioning?: boolean;
  color?: string;
  brandId: number;
  modelId: number;
  fuelTypeId: number;
}

export interface DriverRequest {
  sapNumber: number;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: string;
}

export interface TravelOrderRequest {
  startingMileage: number;
  endingMileage?: number;
  departureDate: string;
  returnDate?: string;
  destination?: string;
  purpose?: string;
  notes?: string;
  locationId: number;
  driverIds?: number[];
  vehicleIds?: number[];
}

export interface AppUserRequest {
  username: string;
  fullName: string;
  password: string;
  isActive: boolean;
  roleId: number;
}

// ============================================
// Auth Types
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AppUserResponse;
}

export interface AuthUser {
  idUser: number;
  username: string;
  fullName: string;
  role: string;
  locationIds: number[];
}

// ============================================
// Simple Entity Types (no DTO, direct entity)
// ============================================

export interface FuelType {
  idFuelType: number;
  fuelName: string;
}

export interface Role {
  idRole: number;
  name: string;
}

export interface Registration {
  idRegistration: number;
  registrationNumber: string;
  expirationDate: string;
  vehicleId: number;
}

export interface DriversLicense {
  idDriversLicense: number;
  licenseNumber: string;
  expirationDate: string;
  driverId: number;
}

export interface FirstAidKit {
  idFirstAidKit: number;
  expirationDate: string;
  vehicleId: number;
}

export interface LicenseCategory {
  idLicenseCategory: number;
  categoryName: string;
}

export interface VehicleLocation {
  idVehicleLocation: number;
  vehicleId: number;
  locationUnitId: number;
}

export interface DriverLocation {
  idDriverLocation: number;
  driverId: number;
  locationUnitId: number;
}

// ============================================
// Utility Types
// ============================================

export type EntityStatus = 'Active' | 'Inactive';
export type TravelOrderStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ApiError {
  message: string;
  status: number;
  timestamp?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
}
