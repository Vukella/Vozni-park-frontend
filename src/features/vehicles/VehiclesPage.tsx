import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Filter, MapPin, Loader2 } from 'lucide-react';
import {
    DataTable,
    FormModal,
    ConfirmDialog,
    PageHeader,
    StatusBadge,
    SearchInput,
} from '../../components';
import type { Column, FormField } from '../../components';
import { Modal } from '../../components/ui/Modal';
import { useApiData, useToast } from '../../hooks';
import { vehicleApi, brandApi, vehicleModelApi, fuelTypeApi, vehicleLocationApi, locationApi } from '../../api/endpoints';
import type {
    VehicleResponse,
    VehicleRequest,
    BrandResponse,
    VehicleModelResponse,
    FuelType,
    VehicleLocation,
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

    // Data fetching
    const { data: vehicles, loading, refresh } = useApiData(() => vehicleApi.getAll());
    const { data: brands } = useApiData(() => brandApi.getAll());
    const { data: allModels } = useApiData(() => vehicleModelApi.getAll());
    const { data: fuelTypes } = useApiData(() => fuelTypeApi.getAll());
    const { data: locations } = useApiData(() => locationApi.getAll());
    const { data: vehicleLocations, refresh: refreshLocations } = useApiData(() => vehicleLocationApi.getAll());

    // vehicleId → VehicleLocation record (needed for update/delete — requires the assignment ID)
    const vehicleLocationMap = useMemo(() => {
        const map = new Map<number, VehicleLocation>();
        vehicleLocations.forEach((vl) => map.set(vl.vehicleId, vl));
        return map;
    }, [vehicleLocations]);

    // UI state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<VehicleResponse | null>(null);

    // Location assignment state
    const [locationTarget, setLocationTarget] = useState<VehicleResponse | null>(null);
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [locationSaving, setLocationSaving] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');

    // brandId is UI-only for filtering the model dropdown — never sent to backend
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
                    v.registration?.registrationNumber?.toLowerCase().includes(q) ||
                    v.vehicleModel?.modelName?.toLowerCase().includes(q) ||
                    v.tireMarking?.toLowerCase().includes(q)
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
                key: 'vehicleModel.modelName',
                header: 'Model',
                sortable: true,
                render: (v) => v.vehicleModel?.modelName || '—',
            },
            {
                key: 'registration.registrationNumber',
                header: 'Plate / Reg #',
                render: (v) => v.registration?.registrationNumber || '—',
            },
            {
                key: 'yearOfManufacture',
                header: 'Year',
                sortable: true,
                render: (v) => v.yearOfManufacture || '—',
            },
            {
                key: 'power',
                header: 'Power (HP)',
                sortable: true,
                render: (v) => (v.power != null ? `${v.power} HP` : '—'),
            },
            {
                key: 'fuelType.fuelName',
                header: 'Fuel',
                sortable: true,
                render: (v) => v.fuelType?.fuelName || '—',
            },
            {
                key: 'location.locationName',
                header: 'Location',
                sortable: true,
                render: (v) => v.location?.locationName || 'Unassigned',
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
                label: 'Chassis Number (VIN)',
                type: 'text',
                required: true,
                placeholder: 'e.g. WBA3A5C55CF256789',
            },
            {
                key: 'brandId',
                label: 'Brand (filter only)',
                type: 'select',
                required: false,
                options: brands.map((b: BrandResponse) => ({ value: b.idBrand, label: b.brandName })),
                helpText: 'Select a brand to filter the model list below. Not saved to vehicle.',
            },
            {
                key: 'vehicleModelId',
                label: 'Model',
                type: 'select',
                required: true,
                options: filteredModels.map((m: VehicleModelResponse) => ({
                    value: m.idVehicleModel,
                    label: m.modelName,
                })),
                helpText: selectedBrandId
                    ? 'Showing models for selected brand'
                    : 'Select a brand above to filter models',
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
                required: false,
                options: STATUS_OPTIONS,
            },
            {
                key: 'statusCode',
                label: 'Status Code',
                type: 'select',
                required: false,
                options: STATUS_CODE_OPTIONS,
            },
            {
                key: 'yearOfManufacture',
                label: 'Year of Manufacture',
                type: 'number',
                placeholder: 'e.g. 2020',
                min: 1900,
                max: new Date().getFullYear() + 1,
            },
            {
                key: 'power',
                label: 'Power (HP)',
                type: 'number',
                placeholder: 'e.g. 150',
                min: 0,
                helpText: 'Engine power in horsepower',
            },
            {
                key: 'engineDisplacement',
                label: 'Engine Displacement (cc)',
                type: 'number',
                placeholder: 'e.g. 1998',
                min: 0,
            },
            {
                key: 'engineNumber',
                label: 'Engine Number',
                type: 'number',
                placeholder: 'e.g. 123456789',
                min: 0,
            },
            {
                key: 'tagSerialNumber',
                label: 'Tag Serial Number',
                type: 'number',
                placeholder: 'e.g. 987654321',
                min: 0,
                helpText: 'RFID/Tracking tag serial number',
            },
            {
                key: 'tireMarking',
                label: 'Tire Marking',
                type: 'text',
                placeholder: 'e.g. 205/55R16',
                helpText: 'Tire size marking',
            },
            {
                key: 'fireExtinguisherSerialNumber',
                label: 'Fire Extinguisher Serial #',
                type: 'number',
                placeholder: 'e.g. 111222333',
                min: 0,
            },
            {
                key: 'registrationId',
                label: 'Registration ID',
                type: 'number',
                placeholder: 'e.g. 1',
                min: 1,
                helpText: 'Link to an existing registration record (manage via Registrations page)',
            },
            {
                key: 'firstAidKitId',
                label: 'First Aid Kit ID',
                type: 'number',
                placeholder: 'e.g. 1',
                min: 1,
                helpText: 'Link to an existing first aid kit record (manage via First Aid Kits page)',
            },
        ],
        [brands, filteredModels, fuelTypes, selectedBrandId]
    );

    // CRUD handlers
    function handleCreate() {
        setEditingVehicle(null);
        setSelectedBrandId(null);
        setFormOpen(true);
    }

    function handleEdit(vehicle: VehicleResponse) {
        setEditingVehicle(vehicle);
        const model = allModels.find((m) => m.idVehicleModel === vehicle.vehicleModel?.idVehicleModel);
        setSelectedBrandId(model?.brand?.idBrand || null);
        setFormOpen(true);
    }

    async function handleSubmit(formData: Record<string, unknown>) {
        const request: VehicleRequest = {
            sapNumber: Number(formData.sapNumber),
            chassisNumber: String(formData.chassisNumber),
            vehicleModelId: Number(formData.vehicleModelId),
            fuelTypeId: Number(formData.fuelTypeId),
            vehicleStatus: formData.vehicleStatus ? String(formData.vehicleStatus) : undefined,
            statusCode: formData.statusCode ? Number(formData.statusCode) : undefined,
            yearOfManufacture: formData.yearOfManufacture ? Number(formData.yearOfManufacture) : undefined,
            power: formData.power ? Number(formData.power) : undefined,
            engineDisplacement: formData.engineDisplacement ? Number(formData.engineDisplacement) : undefined,
            engineNumber: formData.engineNumber ? Number(formData.engineNumber) : undefined,
            tagSerialNumber: formData.tagSerialNumber ? Number(formData.tagSerialNumber) : undefined,
            tireMarking: formData.tireMarking ? String(formData.tireMarking) : undefined,
            fireExtinguisherSerialNumber: formData.fireExtinguisherSerialNumber
                ? Number(formData.fireExtinguisherSerialNumber)
                : undefined,
            registrationId: formData.registrationId ? Number(formData.registrationId) : undefined,
            firstAidKitId: formData.firstAidKitId ? Number(formData.firstAidKitId) : undefined,
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

    function getEditInitialData(): Record<string, unknown> | undefined {
        if (!editingVehicle) return undefined;
        const model = allModels.find(
            (m) => m.idVehicleModel === editingVehicle.vehicleModel?.idVehicleModel
        );
        return {
            sapNumber: editingVehicle.sapNumber,
            chassisNumber: editingVehicle.chassisNumber,
            brandId: model?.brand?.idBrand || '',
            vehicleModelId: editingVehicle.vehicleModel?.idVehicleModel || '',
            fuelTypeId: editingVehicle.fuelType?.idFuelType || '',
            vehicleStatus: editingVehicle.vehicleStatus,
            statusCode: editingVehicle.statusCode,
            yearOfManufacture: editingVehicle.yearOfManufacture || '',
            power: editingVehicle.power || '',
            engineDisplacement: editingVehicle.engineDisplacement || '',
            engineNumber: editingVehicle.engineNumber || '',
            tagSerialNumber: editingVehicle.tagSerialNumber || '',
            tireMarking: editingVehicle.tireMarking || '',
            fireExtinguisherSerialNumber: editingVehicle.fireExtinguisherSerialNumber || '',
            registrationId: editingVehicle.registration?.idRegistration || '',
            firstAidKitId: editingVehicle.firstAidKit?.idFirstAidKit || '',
        };
    }

    // Location assignment handlers
    function handleOpenLocationModal(vehicle: VehicleResponse) {
        setLocationTarget(vehicle);
        const existing = vehicleLocationMap.get(vehicle.idVehicle);
        setSelectedLocationId(existing ? String(existing.locationUnitId) : '');
        setLocationModalOpen(true);
    }

    async function handleSaveLocation() {
        if (!locationTarget || !selectedLocationId) return;
        setLocationSaving(true);
        try {
            const existing = vehicleLocationMap.get(locationTarget.idVehicle);
            if (existing) {
                await vehicleLocationApi.update(existing.idVehicleLocation, Number(selectedLocationId));
                toast.success('Location updated.');
            } else {
                await vehicleLocationApi.assign(locationTarget.idVehicle, Number(selectedLocationId));
                toast.success('Location assigned.');
            }
            refreshLocations();
            refresh();
            setLocationModalOpen(false);
            setLocationTarget(null);
        } catch {
            toast.error('Failed to save location assignment.');
        } finally {
            setLocationSaving(false);
        }
    }

    async function handleRemoveLocation() {
        if (!locationTarget) return;
        const existing = vehicleLocationMap.get(locationTarget.idVehicle);
        if (!existing) return;
        setLocationSaving(true);
        try {
            await vehicleLocationApi.delete(existing.idVehicleLocation);
            toast.success('Location assignment removed.');
            refreshLocations();
            refresh();
            setLocationModalOpen(false);
            setLocationTarget(null);
        } catch {
            toast.error('Failed to remove location assignment.');
        } finally {
            setLocationSaving(false);
        }
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
                    placeholder="Search by SAP, chassis, reg #, model..."
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
                            onClick={() => handleOpenLocationModal(vehicle)}
                            className="btn-icon text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Assign location"
                        >
                            <MapPin className="h-4 w-4" />
                        </button>
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
                            deleteTarget.registration?.registrationNumber
                                ? ` (${deleteTarget.registration.registrationNumber})`
                                : ''
                        }? This action cannot be undone.`
                        : ''
                }
            />

            {/* Location Assignment Modal */}
            <Modal
                open={locationModalOpen}
                onClose={() => {
                    setLocationModalOpen(false);
                    setLocationTarget(null);
                }}
                title={`Assign Location — SAP #${locationTarget?.sapNumber ?? ''}`}
                size="sm"
                footer={
                    <div className="flex w-full items-center justify-between">
                        <div>
                            {locationTarget && vehicleLocationMap.has(locationTarget.idVehicle) && (
                                <button
                                    onClick={handleRemoveLocation}
                                    className="btn-icon text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 text-sm font-medium"
                                    disabled={locationSaving}
                                >
                                    Remove Assignment
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLocationModalOpen(false)}
                                className="btn-secondary"
                                disabled={locationSaving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLocation}
                                className="btn-primary"
                                disabled={locationSaving || !selectedLocationId}
                            >
                                {locationSaving
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <MapPin className="h-4 w-4" />
                                }
                                {locationSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                }
            >
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Location
                        </label>
                        <select
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            className="input-field"
                            disabled={locationSaving}
                        >
                            <option value="">Select a location...</option>
                            {locations.map((l) => (
                                <option key={l.idLocationUnit} value={l.idLocationUnit}>
                                    {l.locationName}
                                </option>
                            ))}
                        </select>
                    </div>
                    {locationTarget?.location && (
                        <p className="text-xs text-gray-400">
                            Currently assigned to:{' '}
                            <span className="font-medium text-gray-600">
                                {locationTarget.location.locationName}
                            </span>
                        </p>
                    )}
                </div>
            </Modal>
        </div>
    );
}