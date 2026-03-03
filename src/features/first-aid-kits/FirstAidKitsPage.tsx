import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, StatusBadge } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { firstAidKitApi, vehicleApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import type { FirstAidKit, FirstAidKitWriteData } from '../../types';

export function FirstAidKitsPage() {
    const toast = useToast();
    const { data: kits, loading, refresh } = useApiData(() => firstAidKitApi.getAll());
    const { data: vehicles } = useApiData(() => vehicleApi.getAll());

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<FirstAidKit | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FirstAidKit | null>(null);

    function isExpired(dateStr: string) {
        return new Date(dateStr) < new Date();
    }

    const columns: Column<FirstAidKit>[] = useMemo(
        () => [
            {
                key: 'idFirstAidKit',
                header: 'ID',
                sortable: true,
            },
            {
                key: 'vehicleId',
                header: 'Vehicle (SAP)',
                sortable: true,
                render: (k) => {
                    if (!k.vehicleId) return '—';
                    const v = vehicles.find((v) => v.idVehicle === k.vehicleId);
                    return v
                        ? <span className="font-medium text-gray-900">SAP #{v.sapNumber}</span>
                        : `Vehicle #${k.vehicleId}`;
                },
            },
            {
                key: 'expirationDate',
                header: 'Expires',
                sortable: true,
                render: (k) => (
                    <span className="flex items-center gap-2">
            {formatDate(k.expirationDate)}
                        {k.expirationDate && isExpired(k.expirationDate) && (
                            <StatusBadge status="Expired" />
                        )}
          </span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                sortable: true,
                render: (k) => k.status ? <StatusBadge status={k.status} /> : '—',
            },
        ],
        [vehicles]
    );

    // FIXED: vehicle dropdown uses registration.registrationNumber or chassisNumber
    // (registrationPlate no longer exists on VehicleResponse)
    const getFormFields = useCallback(
        (): FormField[] => [
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
                key: 'expiryDate',
                label: 'Expiration Date',
                type: 'date',
                required: true,
                helpText: 'First aid kit expiry date',
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

    // FIXED: write payload uses entity field name expiryDate (not expirationDate)
    // FirstAidKit entity has expiryDate; the ResponseDTO maps it to expirationDate for reads
    async function handleSubmit(formData: Record<string, unknown>) {
        const data: FirstAidKitWriteData = {
            expiryDate: String(formData.expiryDate),
            status: formData.status ? String(formData.status) : undefined,
        };
        if (editing) {
            await firstAidKitApi.update(editing.idFirstAidKit, data as any);
            toast.success('First aid kit updated.');
        } else {
            await firstAidKitApi.create(data as any);
            toast.success('First aid kit created.');
        }
        refresh();
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        await firstAidKitApi.delete(deleteTarget.idFirstAidKit);
        toast.success('First aid kit deleted.');
        refresh();
    }

    return (
        <div>
            <PageHeader
                title="First Aid Kits"
                description={`${kits.length} kit${kits.length !== 1 ? 's' : ''}`}
                action={
                    <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
                        <Plus className="h-4 w-4" /> Add Kit
                    </button>
                }
            />
            <DataTable
                columns={columns}
                data={kits}
                keyExtractor={(k) => k.idFirstAidKit}
                loading={loading}
                emptyMessage="No first aid kits found."
                actions={(k) => (
                    <>
                        <button onClick={() => { setEditing(k); setFormOpen(true); }} className="btn-icon" title="Edit">
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(k)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </>
                )}
            />
            <FormModal
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditing(null); }}
                onSubmit={handleSubmit}
                title={editing ? 'Edit First Aid Kit' : 'Add First Aid Kit'}
                fields={getFormFields()}
                initialData={
                    editing
                        ? {
                            vehicleId: editing.vehicleId || '',
                            // FIXED: pre-populate expiryDate from expirationDate (read-side name)
                            expiryDate: editing.expirationDate || '',
                            status: editing.status || '',
                        }
                        : undefined
                }
                submitLabel={editing ? 'Update' : 'Create'}
                size="sm"
            />
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete First Aid Kit"
                message={deleteTarget ? `Delete this first aid kit?` : ''}
            />
        </div>
    );
}