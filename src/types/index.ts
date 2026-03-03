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

// Backend DriverSummaryDTO uses fullName (not firstName/lastName)
export interface DriverSummary {
  idDriver: number;
  sapNumber: number;
  fullName: string | null;
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

// FIXED: matches VehicleResponseDTO.RegistrationSummaryDTO
// registrationNumber = the plate/reg number shown in vehicle table
export interface RegistrationInfo {
  idRegistration: number;
  registrationNumber: string;
  dateFrom: string;
  dateTo: string;
  status: string;
}

// FIXED: matches VehicleResponseDTO.FirstAidKitSummaryDTO
// expiryDate (not expirationDate) — this is the nested version inside VehicleResponse
export interface FirstAidKitInfo {
  idFirstAidKit: number;
  expiryDate: string;
  status: string;
}

// FIXED: matches VehicleResponseDTO exactly
export interface VehicleResponse {
  idVehicle: number;
  sapNumber: number;
  chassisNumber: string;
  engineNumber: number | null;
  tagSerialNumber: number | null;
  yearOfManufacture: number | null;
  engineDisplacement: number | null;
  power: number | null;
  tireMarking: string | null;
  fireExtinguisherSerialNumber: number | null;
  vehicleStatus: string;
  statusCode: number;
  vehicleModel: VehicleModelSummary | null;
  fuelType: FuelTypeSummary | null;
  registration: RegistrationInfo | null;
  firstAidKit: FirstAidKitInfo | null;
  location: LocationUnitSummary | null;
}

// FIXED: matches DriverResponseDTO
export interface DriverLicenseSummary {
  idDriversLicense: number;
  dateFrom: string;
  dateTo: string;
  status: string;
  licenseCategory: string;
}

export interface DriverResponse {
  idDriver: number;
  sapNumber: number;
  fullName: string | null;
  phone: string | null;
  status: string;
  statusCode: number | null;
  location: LocationUnitSummary | null;
  licenses: DriverLicenseSummary[];
}

// FIXED: matches TravelOrderResponseDTO — no destination/purpose/notes (not in DB)
export interface TravelOrderResponse {
  idTravelOrder: number;
  travelOrderNumber: string;
  workOrderNumber: string;
  status: string;
  startingMileage: number;
  endingMileage: number | null;
  dateFrom: string;
  dateTo: string;
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
  vehicleModelCount: number;  // was: modelCount
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

// FIXED: matches VehicleRequestDTO exactly
export interface VehicleRequest {
  sapNumber: number;
  chassisNumber: string;
  engineNumber?: number;
  tagSerialNumber?: number;
  yearOfManufacture?: number;
  engineDisplacement?: number;
  power?: number;
  tireMarking?: string;
  fireExtinguisherSerialNumber?: number;
  vehicleStatus?: string;
  statusCode?: number;
  fuelTypeId: number;
  vehicleModelId: number;
  registrationId?: number;
  firstAidKitId?: number;
}

// FIXED: matches DriverRequestDTO
export interface DriverRequest {
  sapNumber: number;
  fullName: string;
  phone?: string;
  status: string;
  statusCode?: number;
}

// FIXED: matches TravelOrderRequestDTO — no destination/purpose/notes
export interface TravelOrderRequest {
  locationId: number;
  workOrderNumber: string;
  dateFrom: string;
  dateTo: string;
  travelOrderNumber?: string;
  startingMileage: number;
  endingMileage?: number;
  status?: string;
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

// Confirmed: matches backend LoginResponseDTO
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
// Simple Entity Types
// These are used for both read (ResponseDTO) and write (raw entity) operations.
// IMPORTANT: POST/PUT endpoints accept raw entity field names, which differ
// from the response DTO field names in some cases — see notes per type.
// ============================================

// FuelType — returned directly from /fuel-types (no DTO wrapper)
export interface FuelType {
  idFuelType: number;
  fuelName: string;
}

// Role — returned directly from /roles (no DTO wrapper)
export interface Role {
  idRole: number;
  name: string;
}

// FIXED: matches RegistrationResponseDTO (GET) and Registration entity (POST/PUT)
// GET response returns: expirationDate (mapped from entity.dateTo)
// POST/PUT entity expects: dateTo (not expirationDate)
// Use RegistrationWriteData for create/update payloads.
export interface Registration {
  idRegistration: number;
  registrationNumber: string;
  dateFrom: string;
  expirationDate: string; // read-side: DTO maps entity.dateTo → expirationDate
  policyNumber: number | null;
  status: string;
  statusCode: number | null;
  vehicleId: number | null;
}

// Write payload for POST/PUT — uses entity field names
export interface RegistrationWriteData {
  registrationNumber: string;
  dateFrom?: string;
  dateTo: string;           // entity field name (NOT expirationDate)
  policyNumber?: number;
  status?: string;
  statusCode?: number;
}

// FIXED: matches DriversLicenseResponseDTO
// licenseNumber does NOT exist in the entity or DB — removed
// driverId does NOT exist in the response DTO — removed
// The driver↔license link is managed via DriverLicenseAssignment, not this entity
export interface DriversLicense {
  idDriversLicense: number;
  dateFrom: string;
  expirationDate: string;   // read-side: DTO maps entity.dateTo → expirationDate
  status: string;
  statusCode: number | null;
}

// Write payload for POST/PUT — uses entity field names
export interface DriversLicenseWriteData {
  dateFrom?: string;
  dateTo: string;           // entity field name (NOT expirationDate)
  status?: string;
  statusCode?: number;
}

// FIXED: matches FirstAidKitResponseDTO (GET) and FirstAidKit entity (POST/PUT)
// GET response returns: expirationDate (DTO maps entity.expiryDate → expirationDate)
// POST/PUT entity expects: expiryDate (not expirationDate)
// vehicleId is included in the response DTO
export interface FirstAidKit {
  idFirstAidKit: number;
  expirationDate: string;   // read-side: DTO maps entity.expiryDate → expirationDate
  status: string;
  statusCode: number | null;
  vehicleId: number | null;
}

// Write payload for POST/PUT — uses entity field names
export interface FirstAidKitWriteData {
  expiryDate: string;       // entity field name (NOT expirationDate)
  status?: string;
  statusCode?: number;
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