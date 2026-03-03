import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, SearchInput, StatusBadge } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { registrationApi, vehicleApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import type { Registration, RegistrationWriteData } from '../../types';

export function RegistrationsPage() {
    const toast = useToast();
    const { data: registrations, loading, refresh } = useApiData(() => registrationApi.getAll());
    const { data: vehicles } = useApiData(() => vehicleApi.getAll());

    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Registration | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);

    const filtered = useMemo(() => {
        if (!search) return registrations;
        const q = search.toLowerCase();
        return registrations.filter((r) => r.registrationNumber?.toLowerCase().includes(q));
    }, [registrations, search]);

    function isExpired(dateStr: string) {
        return new Date(dateStr) < new Date();
    }

    const columns: Column<Registration>[] = useMemo(
        () => [
            {
                key: 'idRegistration',
                header: 'ID',
                sortable: true,
            },
            {
                key: 'registrationNumber',
                header: 'Registration #',
                sortable: true,
                render: (r) => <span className="font-medium text-gray-900">{r.registrationNumber}</span>,
            },
            {
                key: 'vehicleId',
                header: 'Vehicle (SAP)',
                sortable: true,
                render: (r) => {
                    if (!r.vehicleId) return '—';
                    const v = vehicles.find((v) => v.idVehicle === r.vehicleId);
                    return v ? `SAP #${v.sapNumber}` : `Vehicle #${r.vehicleId}`;
                },
            },
            {
                key: 'dateFrom',
                header: 'Valid From',
                sortable: true,
                render: (r) => formatDate(r.dateFrom),
            },
            {
                key: 'expirationDate',
                header: 'Expires',
                sortable: true,
                render: (r) => (
                    <span className="flex items-center gap-2">
            {formatDate(r.expirationDate)}
                        {r.expirationDate && isExpired(r.expirationDate) && (
                            <StatusBadge status="Expired" />
                        )}
          </span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                sortable: true,
                render: (r) => r.status ? <StatusBadge status={r.status} /> : '—',
            },
        ],
        [vehicles]
    );

    // FIXED: vehicle dropdown uses registration.registrationNumber or chassisNumber
    // (registrationPlate no longer exists on VehicleResponse)
    const getFormFields = useCallback(
        (): FormField[] => [
            {
                key: 'registrationNumber',
                label: 'Registration Number',
                type: 'text',
                required: true,
                placeholder: 'e.g. BG-1234-AB',
            },
            {
                key: 'vehicleId',
                label: 'Vehicle',
                type: 'select',
                required: true,
                options: vehicles.map((v) => ({
                    value: v.idVehicle,
                    label: `SAP #${v.sapNumber} — ${v.registration?.registrationNumber || v.chassisNumber}`,
                })),
            },
            {
                key: 'dateFrom',
                label: 'Valid From',
                type: 'date',
            },
            {
                key: 'dateTo',
                label: 'Expiration Date',
                type: 'date',
                required: true,
            },
            {
                key: 'policyNumber',
                label: 'Policy Number',
                type: 'number',
                placeholder: 'e.g. 123456',
                min: 0,
            },
            {
                key: 'status',
                label: 'Status',
                type: 'text',
                placeholder: 'e.g. Active',
            },
        ],
        [vehicles]
    );

    // FIXED: write payload uses entity field names (dateTo, not expirationDate)
    async function handleSubmit(formData: Record<string, unknown>) {
        const data: RegistrationWriteData = {
            registrationNumber: String(formData.registrationNumber),
            dateTo: String(formData.dateTo),         // entity field name
            dateFrom: formData.dateFrom ? String(formData.dateFrom) : undefined,
            policyNumber: formData.policyNumber ? Number(formData.policyNumber) : undefined,
            status: formData.status ? String(formData.status) : undefined,
        };
        if (editing) {
            await registrationApi.update(editing.idRegistration, data as any);
            toast.success('Registration updated.');
        } else {
            await registrationApi.create(data as any);
            toast.success('Registration created.');
        }
        refresh();
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        await registrationApi.delete(deleteTarget.idRegistration);
        toast.success('Registration deleted.');
        refresh();
    }

    return (
        <div>
            <PageHeader
                title="Registrations"
                description={`${filtered.length} registration${filtered.length !== 1 ? 's' : ''}`}
                action={
                    <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
                        <Plus className="h-4 w-4" /> Add Registration
                    </button>
                }
            />
            <div className="mb-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by registration #..." className="w-full sm:w-72" />
            </div>
            <DataTable
                columns={columns}
                data={filtered}
                keyExtractor={(r) => r.idRegistration}
                loading={loading}
                emptyMessage="No registrations found."
                actions={(r) => (
                    <>
                        <button onClick={() => { setEditing(r); setFormOpen(true); }} className="btn-icon" title="Edit">
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(r)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </>
                )}
            />
            <FormModal
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditing(null); }}
                onSubmit={handleSubmit}
                title={editing ? 'Edit Registration' : 'Add Registration'}
                fields={getFormFields()}
                initialData={
                    editing
                        ? {
                            registrationNumber: editing.registrationNumber,
                            vehicleId: editing.vehicleId || '',
                            dateFrom: editing.dateFrom || '',
                            // FIXED: edit pre-populates dateTo from expirationDate (read name)
                            dateTo: editing.expirationDate || '',
                            policyNumber: editing.policyNumber || '',
                            status: editing.status || '',
                        }
                        : undefined
                }
                submitLabel={editing ? 'Update' : 'Create'}
                size="md"
            />
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Registration"
                message={deleteTarget ? `Delete registration "${deleteTarget.registrationNumber}"?` : ''}
            />
        </div>
    );
}