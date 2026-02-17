import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, SearchInput, StatusBadge } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { driversLicenseApi, driverApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import type { DriversLicense } from '../../types';

export function DriversLicensesPage() {
  const toast = useToast();
  const { data: licenses, loading, refresh } = useApiData(() => driversLicenseApi.getAll());
  const { data: drivers } = useApiData(() => driverApi.getAll());

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DriversLicense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriversLicense | null>(null);

  const filtered = useMemo(() => {
    if (!search) return licenses;
    const q = search.toLowerCase();
    return licenses.filter((l) => l.licenseNumber?.toLowerCase().includes(q));
  }, [licenses, search]);

  function isExpired(dateStr: string) {
    return new Date(dateStr) < new Date();
  }

  const columns: Column<DriversLicense>[] = useMemo(
    () => [
      { key: 'idDriversLicense', header: 'ID', sortable: true },
      { key: 'licenseNumber', header: 'License #', sortable: true, render: (l) => <span className="font-medium text-gray-900">{l.licenseNumber}</span> },
      { key: 'driverId', header: 'Driver', sortable: true, render: (l) => {
        const d = drivers.find((d) => d.idDriver === l.driverId);
        return d ? `${d.firstName} ${d.lastName} (SAP #${d.sapNumber})` : `Driver #${l.driverId}`;
      }},
      { key: 'expirationDate', header: 'Expires', sortable: true, render: (l) => (
        <span className="flex items-center gap-2">
          {formatDate(l.expirationDate)}
          {isExpired(l.expirationDate) && <StatusBadge status="Expired" />}
        </span>
      )},
    ],
    [drivers]
  );

  const getFormFields = useCallback(
    (): FormField[] => [
      { key: 'licenseNumber', label: 'License Number', type: 'text', required: true, placeholder: 'e.g. DL-2024-001' },
      {
        key: 'driverId',
        label: 'Driver',
        type: 'select',
        required: true,
        options: drivers.map((d) => ({ value: d.idDriver, label: `${d.firstName} ${d.lastName} (SAP #${d.sapNumber})` })),
      },
      { key: 'expirationDate', label: 'Expiration Date', type: 'date', required: true },
    ],
    [drivers]
  );

  async function handleSubmit(formData: Record<string, unknown>) {
    const data = {
      licenseNumber: String(formData.licenseNumber),
      expirationDate: String(formData.expirationDate),
      driverId: Number(formData.driverId),
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
      <PageHeader title="Drivers Licenses" description={`${filtered.length} license${filtered.length !== 1 ? 's' : ''}`}
        action={<button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add License</button>}
      />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search by license #..." className="w-full sm:w-72" /></div>
      <DataTable columns={columns} data={filtered} keyExtractor={(l) => l.idDriversLicense} loading={loading} emptyMessage="No drivers licenses found."
        actions={(l) => (
          <>
            <button onClick={() => { setEditing(l); setFormOpen(true); }} className="btn-icon" title="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleteTarget(l)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      />
      <FormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit}
        title={editing ? 'Edit License' : 'Add License'} fields={getFormFields()}
        initialData={editing ? { licenseNumber: editing.licenseNumber, driverId: editing.driverId, expirationDate: editing.expirationDate?.split('T')[0] || '' } : undefined}
        submitLabel={editing ? 'Update' : 'Create'} size="md"
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete License" message={deleteTarget ? `Delete license "${deleteTarget.licenseNumber}"?` : ''}
      />
    </div>
  );
}
