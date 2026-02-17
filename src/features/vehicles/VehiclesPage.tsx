import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Car, Filter } from 'lucide-react';
import {
  DataTable,
  FormModal,
  ConfirmDialog,
  PageHeader,
  StatusBadge,
  SearchInput,
} from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast, useAuth } from '../../hooks';
import { vehicleApi, brandApi, vehicleModelApi, fuelTypeApi } from '../../api/endpoints';
import { formatNumber } from '../../utils/format';
import type {
  VehicleResponse,
  VehicleRequest,
  BrandResponse,
  VehicleModelResponse,
  FuelType,
} from '../../types';

// ============================================
// Status options
// ============================================

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const STATUS_CODE_OPTIONS = [
  { value: 1, label: '1 - Operational' },
  { value: 2, label: '2 - In Maintenance' },
  { value: 3, label: '3 - Decommissioned' },
];

// ============================================
// Component
// ============================================

export function VehiclesPage() {
  const toast = useToast();
  const { isSuperAdmin } = useAuth();

  // Data fetching
  const { data: vehicles, loading, refresh } = useApiData(() => vehicleApi.getAll());
  const { data: brands } = useApiData(() => brandApi.getAll());
  const { data: allModels } = useApiData(() => vehicleModelApi.getAll());
  const { data: fuelTypes } = useApiData(() => fuelTypeApi.getAll());

  // UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(null);

  // Filtered models based on selected brand in form
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [filteredModels, setFilteredModels] = useState<VehicleModelResponse[]>([]);

  useEffect(() => {
    if (selectedBrandId) {
      setFilteredModels(allModels.filter((m) => m.brand?.idBrand === selectedBrandId));
    } else {
      setFilteredModels(allModels);
    }
  }, [selectedBrandId, allModels]);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    let result = vehicles;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          String(v.sapNumber).includes(q) ||
          v.chassisNumber?.toLowerCase().includes(q) ||
          v.registrationPlate?.toLowerCase().includes(q) ||
          v.brand?.brandName?.toLowerCase().includes(q) ||
          v.vehicleModel?.modelName?.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((v) => v.vehicleStatus === statusFilter);
    }

    return result;
  }, [vehicles, search, statusFilter]);

  // Table columns
  const columns: Column<VehicleResponse>[] = useMemo(
    () => [
      {
        key: 'sapNumber',
        header: 'SAP #',
        sortable: true,
        render: (v) => <span className="font-medium text-gray-900">{v.sapNumber}</span>,
      },
      {
        key: 'brand.brandName',
        header: 'Brand',
        sortable: true,
        render: (v) => v.brand?.brandName || '—',
      },
      {
        key: 'vehicleModel.modelName',
        header: 'Model',
        sortable: true,
        render: (v) => v.vehicleModel?.modelName || '—',
      },
      {
        key: 'registrationPlate',
        header: 'Plate',
        sortable: true,
        render: (v) => v.registrationPlate || '—',
      },
      {
        key: 'yearOfManufacture',
        header: 'Year',
        sortable: true,
        render: (v) => v.yearOfManufacture || '—',
      },
      {
        key: 'mileage',
        header: 'Mileage',
        sortable: true,
        render: (v) => (v.mileage != null ? formatNumber(v.mileage) + ' km' : '—'),
      },
      {
        key: 'fuelType.fuelName',
        header: 'Fuel',
        sortable: true,
        render: (v) => v.fuelType?.fuelName || '—',
      },
      {
        key: 'locationUnit.locationName',
        header: 'Location',
        sortable: true,
        render: (v) => v.locationUnit?.locationName || 'Unassigned',
      },
      {
        key: 'vehicleStatus',
        header: 'Status',
        sortable: true,
        render: (v) => <StatusBadge status={v.vehicleStatus} />,
      },
    ],
    []
  );

  // Form fields
  const getFormFields = useCallback(
    (): FormField[] => [
      {
        key: 'sapNumber',
        label: 'SAP Number',
        type: 'number',
        required: true,
        placeholder: 'e.g. 100001',
        min: 1,
      },
      {
        key: 'chassisNumber',
        label: 'Chassis Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. WBA3A5C55CF256789',
      },
      {
        key: 'registrationPlate',
        label: 'Registration Plate',
        type: 'text',
        placeholder: 'e.g. BG-1234-AB',
      },
      {
        key: 'brandId',
        label: 'Brand',
        type: 'select',
        required: true,
        options: brands.map((b: BrandResponse) => ({ value: b.idBrand, label: b.brandName })),
      },
      {
        key: 'modelId',
        label: 'Model',
        type: 'select',
        required: true,
        options: filteredModels.map((m: VehicleModelResponse) => ({
          value: m.idVehicleModel,
          label: m.modelName,
        })),
        helpText: selectedBrandId ? `Showing models for selected brand` : 'Select a brand first to filter models',
      },
      {
        key: 'fuelTypeId',
        label: 'Fuel Type',
        type: 'select',
        required: true,
        options: fuelTypes.map((f: FuelType) => ({ value: f.idFuelType, label: f.fuelName })),
      },
      {
        key: 'vehicleStatus',
        label: 'Status',
        type: 'select',
        required: true,
        options: STATUS_OPTIONS,
      },
      {
        key: 'statusCode',
        label: 'Status Code',
        type: 'select',
        required: true,
        options: STATUS_CODE_OPTIONS,
      },
      {
        key: 'yearOfManufacture',
        label: 'Year of Manufacture',
        type: 'number',
        placeholder: 'e.g. 2023',
        min: 1900,
        max: new Date().getFullYear() + 1,
      },
      {
        key: 'mileage',
        label: 'Mileage (km)',
        type: 'number',
        placeholder: 'e.g. 50000',
        min: 0,
      },
      {
        key: 'horsePower',
        label: 'Horse Power',
        type: 'number',
        placeholder: 'e.g. 150',
        min: 0,
      },
      {
        key: 'kilowatts',
        label: 'Kilowatts',
        type: 'number',
        placeholder: 'e.g. 110',
        min: 0,
      },
      {
        key: 'displacement',
        label: 'Displacement (cc)',
        type: 'number',
        placeholder: 'e.g. 1998',
        min: 0,
      },
      {
        key: 'numberOfDoors',
        label: 'Doors',
        type: 'number',
        placeholder: 'e.g. 4',
        min: 1,
        max: 10,
      },
      {
        key: 'numberOfSeats',
        label: 'Seats',
        type: 'number',
        placeholder: 'e.g. 5',
        min: 1,
        max: 60,
      },
      {
        key: 'maxSpeed',
        label: 'Max Speed (km/h)',
        type: 'number',
        placeholder: 'e.g. 220',
        min: 0,
      },
      {
        key: 'color',
        label: 'Color',
        type: 'text',
        placeholder: 'e.g. Silver',
      },
      {
        key: 'airConditioning',
        label: 'Air Conditioning',
        type: 'checkbox',
      },
    ],
    [brands, filteredModels, fuelTypes, selectedBrandId]
  );

  // Handlers
  function handleCreate() {
    setEditingVehicle(null);
    setSelectedBrandId(null);
    setFormOpen(true);
  }

  function handleEdit(vehicle: VehicleResponse) {
    setEditingVehicle(vehicle);
    setSelectedBrandId(vehicle.brand?.idBrand || null);
    setFormOpen(true);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    const request: VehicleRequest = {
      sapNumber: Number(formData.sapNumber),
      chassisNumber: String(formData.chassisNumber),
      registrationPlate: formData.registrationPlate ? String(formData.registrationPlate) : undefined,
      vehicleStatus: String(formData.vehicleStatus),
      statusCode: Number(formData.statusCode),
      brandId: Number(formData.brandId),
      modelId: Number(formData.modelId),
      fuelTypeId: Number(formData.fuelTypeId),
      yearOfManufacture: formData.yearOfManufacture ? Number(formData.yearOfManufacture) : undefined,
      mileage: formData.mileage ? Number(formData.mileage) : undefined,
      horsePower: formData.horsePower ? Number(formData.horsePower) : undefined,
      kilowatts: formData.kilowatts ? Number(formData.kilowatts) : undefined,
      displacement: formData.displacement ? Number(formData.displacement) : undefined,
      numberOfDoors: formData.numberOfDoors ? Number(formData.numberOfDoors) : undefined,
      numberOfSeats: formData.numberOfSeats ? Number(formData.numberOfSeats) : undefined,
      maxSpeed: formData.maxSpeed ? Number(formData.maxSpeed) : undefined,
      color: formData.color ? String(formData.color) : undefined,
      airConditioning: formData.airConditioning ? Boolean(formData.airConditioning) : undefined,
    };

    if (editingVehicle) {
      await vehicleApi.update(editingVehicle.idVehicle, request);
      toast.success('Vehicle updated successfully.');
    } else {
      await vehicleApi.create(request);
      toast.success('Vehicle created successfully.');
    }
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await vehicleApi.delete(deleteTarget.idVehicle);
    toast.success('Vehicle deleted successfully.');
    refresh();
  }

  // Get initial data for edit form
  function getEditInitialData(): Record<string, unknown> | undefined {
    if (!editingVehicle) return undefined;
    return {
      sapNumber: editingVehicle.sapNumber,
      chassisNumber: editingVehicle.chassisNumber,
      registrationPlate: editingVehicle.registrationPlate || '',
      brandId: editingVehicle.brand?.idBrand || '',
      modelId: editingVehicle.vehicleModel?.idVehicleModel || '',
      fuelTypeId: editingVehicle.fuelType?.idFuelType || '',
      vehicleStatus: editingVehicle.vehicleStatus,
      statusCode: editingVehicle.statusCode,
      yearOfManufacture: editingVehicle.yearOfManufacture || '',
      mileage: editingVehicle.mileage || '',
      horsePower: editingVehicle.horsePower || '',
      kilowatts: editingVehicle.kilowatts || '',
      displacement: editingVehicle.displacement || '',
      numberOfDoors: editingVehicle.numberOfDoors || '',
      numberOfSeats: editingVehicle.numberOfSeats || '',
      maxSpeed: editingVehicle.maxSpeed || '',
      color: editingVehicle.color || '',
      airConditioning: editingVehicle.airConditioning || false,
    };
  }

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description={`${filteredVehicles.length} vehicle${filteredVehicles.length !== 1 ? 's' : ''} found`}
        action={
          <button className="btn-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Vehicle
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by SAP, chassis, plate, brand..."
          className="w-full sm:w-80"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredVehicles}
        keyExtractor={(v) => v.idVehicle}
        loading={loading}
        emptyMessage="No vehicles found. Try adjusting your search or create a new vehicle."
        actions={(vehicle) => (
          <>
            <button
              onClick={() => handleEdit(vehicle)}
              className="btn-icon"
              title="Edit vehicle"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(vehicle)}
              className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
              title="Delete vehicle"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <FormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingVehicle(null);
          setSelectedBrandId(null);
        }}
        onSubmit={handleSubmit}
        title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        fields={getFormFields()}
        initialData={getEditInitialData()}
        submitLabel={editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
        size="xl"
        onFieldChange={(key, value) => {
          if (key === 'brandId') {
            setSelectedBrandId(value ? Number(value) : null);
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={
          deleteTarget
            ? `Are you sure you want to delete vehicle SAP #${deleteTarget.sapNumber}${
                deleteTarget.registrationPlate ? ` (${deleteTarget.registrationPlate})` : ''
              }? This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
