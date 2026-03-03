import { useState, useMemo } from 'react';
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
import { driverApi, driverLocationApi, locationApi } from '../../api/endpoints';
import type { DriverResponse, DriverRequest, DriverLocation } from '../../types';

// ============================================
// Status options
// ============================================

const STATUS_OPTIONS = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
];

// ============================================
// Helpers
// ============================================

function getLicenseCategories(driver: DriverResponse): string {
    if (!driver.licenses?.length) return '—';
    const categories = driver.licenses
        .map((l) => l.licenseCategory)
        .filter(Boolean);
    return categories.length ? categories.join(', ') : '—';
}

function getLicenseExpiry(driver: DriverResponse): string {
    if (!driver.licenses?.length) return '—';
    const first = driver.licenses[0];
    return first.dateTo || '—';
}

// ============================================
// Component
// ============================================

export function DriversPage() {
    const toast = useToast();

    // Data fetching
    const { data: drivers, loading, refresh } = useApiData(() => driverApi.getAll());
    const { data: locations } = useApiData(() => locationApi.getAll());
    const { data: driverLocations, refresh: refreshLocations } = useApiData(() => driverLocationApi.getAll());

    // driverId → DriverLocation record (needed for update/delete — requires the assignment ID)
    const driverLocationMap = useMemo(() => {
        const map = new Map<number, DriverLocation>();
        driverLocations.forEach((dl) => map.set(dl.driverId, dl));
        return map;
    }, [driverLocations]);

    // UI state
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DriverResponse | null>(null);

    // Location assignment state
    const [locationTarget, setLocationTarget] = useState<DriverResponse | null>(null);
    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [locationSaving, setLocationSaving] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');

    // Filter drivers
    const filteredDrivers = useMemo(() => {
        let result = drivers;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (d) =>
                    String(d.sapNumber).includes(q) ||
                    d.fullName?.toLowerCase().includes(q) ||
                    d.phone?.toLowerCase().includes(q) ||
                    d.licenses?.some((l) => l.licenseCategory?.toLowerCase().includes(q))
            );
        }

        if (statusFilter) {
            result = result.filter((d) => d.status === statusFilter);
        }

        return result;
    }, [drivers, search, statusFilter]);

    // Table columns
    const columns: Column<DriverResponse>[] = useMemo(
        () => [
            {
                key: 'sapNumber',
                header: 'SAP #',
                sortable: true,
                render: (d) => <span className="font-medium text-gray-900">{d.sapNumber}</span>,
            },
            {
                key: 'fullName',
                header: 'Full Name',
                sortable: true,
                render: (d) => d.fullName || '—',
            },
            {
                key: 'phone',
                header: 'Phone',
                render: (d) => d.phone || '—',
            },
            {
                key: 'licenses',
                header: 'License Expiry',
                render: (d) => getLicenseExpiry(d),
            },
            {
                key: 'licenses',
                header: 'Categories',
                render: (d) => getLicenseCategories(d),
            },
            {
                key: 'location.locationName',
                header: 'Location',
                sortable: true,
                render: (d) => d.location?.locationName || 'Unassigned',
            },
            {
                key: 'status',
                header: 'Status',
                sortable: true,
                render: (d) => <StatusBadge status={d.status} />,
            },
        ],
        []
    );

    // Form fields
    const formFields: FormField[] = [
        {
            key: 'sapNumber',
            label: 'SAP Number',
            type: 'number',
            required: true,
            placeholder: 'e.g. 999001',
            min: 1,
        },
        {
            key: 'fullName',
            label: 'Full Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. Petrović Marko',
            colSpan: 2,
            helpText: 'Enter last name and first name (e.g. Petrović Marko)',
        },
        {
            key: 'phone',
            label: 'Phone Number',
            type: 'text',
            placeholder: 'e.g. +381 64 1234567',
            helpText: 'Serbian format: +381 XX XXXXXXX',
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: STATUS_OPTIONS,
        },
    ];

    // CRUD handlers
    function handleCreate() {
        setEditingDriver(null);
        setFormOpen(true);
    }

    function handleEdit(driver: DriverResponse) {
        setEditingDriver(driver);
        setFormOpen(true);
    }

    async function handleSubmit(formData: Record<string, unknown>) {
        const request: DriverRequest = {
            sapNumber: Number(formData.sapNumber),
            fullName: String(formData.fullName),
            phone: formData.phone ? String(formData.phone) : undefined,
            status: String(formData.status),
        };

        if (editingDriver) {
            await driverApi.update(editingDriver.idDriver, request);
            toast.success('Driver updated successfully.');
        } else {
            await driverApi.create(request);
            toast.success('Driver created successfully.');
        }
        refresh();
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        await driverApi.delete(deleteTarget.idDriver);
        toast.success('Driver deleted successfully.');
        refresh();
    }

    function getEditInitialData(): Record<string, unknown> | undefined {
        if (!editingDriver) return undefined;
        return {
            sapNumber: editingDriver.sapNumber,
            fullName: editingDriver.fullName || '',
            phone: editingDriver.phone || '',
            status: editingDriver.status,
        };
    }

    // Location assignment handlers
    function handleOpenLocationModal(driver: DriverResponse) {
        setLocationTarget(driver);
        const existing = driverLocationMap.get(driver.idDriver);
        setSelectedLocationId(existing ? String(existing.locationUnitId) : '');
        setLocationModalOpen(true);
    }

    async function handleSaveLocation() {
        if (!locationTarget || !selectedLocationId) return;
        setLocationSaving(true);
        try {
            const existing = driverLocationMap.get(locationTarget.idDriver);
            if (existing) {
                await driverLocationApi.update(existing.idDriverLocation, Number(selectedLocationId));
                toast.success('Location updated.');
            } else {
                await driverLocationApi.assign(locationTarget.idDriver, Number(selectedLocationId));
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
        const existing = driverLocationMap.get(locationTarget.idDriver);
        if (!existing) return;
        setLocationSaving(true);
        try {
            await driverLocationApi.delete(existing.idDriverLocation);
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
                title="Drivers"
                description={`${filteredDrivers.length} driver${filteredDrivers.length !== 1 ? 's' : ''} found`}
                action={
                    <button className="btn-primary" onClick={handleCreate}>
                        <Plus className="h-4 w-4" />
                        Add Driver
                    </button>
                }
            />

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by SAP, name, phone, license category..."
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
                data={filteredDrivers}
                keyExtractor={(d) => d.idDriver}
                loading={loading}
                emptyMessage="No drivers found. Try adjusting your search or add a new driver."
                actions={(driver) => (
                    <>
                        <button
                            onClick={() => handleOpenLocationModal(driver)}
                            className="btn-icon text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Assign location"
                        >
                            <MapPin className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEdit(driver)} className="btn-icon" title="Edit driver">
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setDeleteTarget(driver)}
                            className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Delete driver"
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
                    setEditingDriver(null);
                }}
                onSubmit={handleSubmit}
                title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
                fields={formFields}
                initialData={getEditInitialData()}
                submitLabel={editingDriver ? 'Update Driver' : 'Create Driver'}
                size="md"
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Driver"
                message={
                    deleteTarget
                        ? `Are you sure you want to delete driver ${deleteTarget.fullName || `SAP #${deleteTarget.sapNumber}`}? This action cannot be undone.`
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
                title={`Assign Location — ${locationTarget?.fullName ?? `SAP #${locationTarget?.sapNumber}`}`}
                size="sm"
                footer={
                    <div className="flex w-full items-center justify-between">
                        <div>
                            {locationTarget && driverLocationMap.has(locationTarget.idDriver) && (
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