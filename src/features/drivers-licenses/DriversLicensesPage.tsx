import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, StatusBadge } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { driversLicenseApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import type { DriversLicense, DriversLicenseWriteData } from '../../types';

// NOTE: The DriversLicense entity and its ResponseDTO do not contain:
// - licenseNumber (this field does not exist in the database)
// - driverId (the driver↔license link is managed via DriverLicenseAssignment,
//   not stored on the license itself)
//
// License categories and driver assignments are managed separately through
// the DriverLicenseAssignment junction table and are visible on the Drivers page
// (each driver shows their license summary including categories).
//
// This page manages the base license records: validity dates and status only.

export function DriversLicensesPage() {
    const toast = useToast();
    const { data: licenses, loading, refresh } = useApiData(() => driversLicenseApi.getAll());

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<DriversLicense | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DriversLicense | null>(null);

    function isExpired(dateStr: string) {
        return new Date(dateStr) < new Date();
    }


    const columns: Column<DriversLicense>[] = useMemo(
        () => [
            {
                key: 'idDriversLicense',
                header: 'ID',
                sortable: true,
                render: (l) => <span className="font-medium text-gray-900">#{l.idDriversLicense}</span>,
            },
            {
                key: 'dateFrom',
                header: 'Valid From',
                sortable: true,
                render: (l) => formatDate(l.dateFrom),
            },
            {
                key: 'expirationDate',
                header: 'Expires',
                sortable: true,
                render: (l) => (
                    <span className="flex items-center gap-2">
            {formatDate(l.expirationDate)}
                        {l.expirationDate && isExpired(l.expirationDate) && (
                            <StatusBadge status="Expired" />
                        )}
          </span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                sortable: true,
                render: (l) => l.status ? <StatusBadge status={l.status} /> : '—',
            },
            {
                key: 'statusCode',
                header: 'Status Code',
                sortable: true,
                render: (l) => l.statusCode ?? '—',
            },
        ],
        []
    );

    // FIXED: form only contains fields the entity actually accepts on write
    // POST/PUT sends raw entity: dateFrom, dateTo, status, statusCode
    const getFormFields = useCallback(
        (): FormField[] => [
            {
                key: 'dateFrom',
                label: 'Valid From',
                type: 'date',
                helpText: 'License issue / valid-from date',
            },
            {
                key: 'dateTo',
                label: 'Expiration Date',
                type: 'date',
                required: true,
            },
            {
                key: 'status',
                label: 'Status',
                type: 'text',
                placeholder: 'e.g. Active',
            },
            {
                key: 'statusCode',
                label: 'Status Code',
                type: 'number',
                placeholder: 'e.g. 1',
                min: 0,
            },
        ],
        []
    );

    // FIXED: write payload uses entity field name dateTo (not expirationDate)
    async function handleSubmit(formData: Record<string, unknown>) {
        const data: DriversLicenseWriteData = {
            dateTo: String(formData.dateTo),
            dateFrom: formData.dateFrom ? String(formData.dateFrom) : undefined,
            status: formData.status ? String(formData.status) : undefined,
            statusCode: formData.statusCode ? Number(formData.statusCode) : undefined,
        };
        if (editing) {
            await driversLicenseApi.update(editing.idDriversLicense, data as any);
            toast.success('License updated.');
        } else {
            await driversLicenseApi.create(data as any);
            toast.success('License created.');
        }
        refresh();
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        await driversLicenseApi.delete(deleteTarget.idDriversLicense);
        toast.success('License deleted.');
        refresh();
    }

    return (
        <div>
            <PageHeader
                title="Drivers Licenses"
                description={`${licenses.length} license record${licenses.length !== 1 ? 's' : ''}`}
                action={
                    <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
                        <Plus className="h-4 w-4" /> Add License
                    </button>
                }
            />
            <DataTable
                columns={columns}
                data={licenses}
                keyExtractor={(l) => l.idDriversLicense}
                loading={loading}
                emptyMessage="No driver license records found."
                actions={(l) => (
                    <>
                        <button onClick={() => { setEditing(l); setFormOpen(true); }} className="btn-icon" title="Edit">
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(l)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </>
                )}
            />
            <FormModal
                open={formOpen}
                onClose={() => { setFormOpen(false); setEditing(null); }}
                onSubmit={handleSubmit}
                title={editing ? 'Edit License' : 'Add License'}
                fields={getFormFields()}
                initialData={
                    editing
                        ? {
                            dateFrom: editing.dateFrom || '',
                            // FIXED: pre-populate dateTo from expirationDate (read-side name)
                            dateTo: editing.expirationDate || '',
                            status: editing.status || '',
                            statusCode: editing.statusCode || '',
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
                title="Delete License"
                message={deleteTarget ? `Delete license record #${deleteTarget.idDriversLicense}?` : ''}
            />
        </div>
    );
}