import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, SearchInput, StatusBadge } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { registrationApi, vehicleApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import type { Registration } from '../../types';

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

  // Check if registration is expired
  function isExpired(dateStr: string) {
    return new Date(dateStr) < new Date();
  }

  const columns: Column<Registration>[] = useMemo(
    () => [
      { key: 'idRegistration', header: 'ID', sortable: true },
      { key: 'registrationNumber', header: 'Registration #', sortable: true, render: (r) => <span className="font-medium text-gray-900">{r.registrationNumber}</span> },
      { key: 'vehicleId', header: 'Vehicle (SAP)', sortable: true, render: (r) => {
        const v = vehicles.find((v) => v.idVehicle === r.vehicleId);
        return v ? `SAP #${v.sapNumber}` : `Vehicle #${r.vehicleId}`;
      }},
      { key: 'expirationDate', header: 'Expires', sortable: true, render: (r) => (
        <span className="flex items-center gap-2">
          {formatDate(r.expirationDate)}
          {isExpired(r.expirationDate) && <StatusBadge status="Expired" />}
        </span>
      )},
    ],
    [vehicles]
  );

  const getFormFields = useCallback(
    (): FormField[] => [
      { key: 'registrationNumber', label: 'Registration Number', type: 'text', required: true, placeholder: 'e.g. REG-2024-001' },
      {
        key: 'vehicleId',
        label: 'Vehicle',
        type: 'select',
        required: true,
        options: vehicles.map((v) => ({ value: v.idVehicle, label: `SAP #${v.sapNumber} — ${v.registrationPlate || v.chassisNumber}` })),
      },
      { key: 'expirationDate', label: 'Expiration Date', type: 'date', required: true },
    ],
    [vehicles]
  );

  async function handleSubmit(formData: Record<string, unknown>) {
    const data = {
      registrationNumber: String(formData.registrationNumber),
      expirationDate: String(formData.expirationDate),
      vehicleId: Number(formData.vehicleId),
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
      <PageHeader title="Registrations" description={`${filtered.length} registration${filtered.length !== 1 ? 's' : ''}`}
        action={<button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add Registration</button>}
      />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search by registration #..." className="w-full sm:w-72" /></div>
      <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.idRegistration} loading={loading} emptyMessage="No registrations found."
        actions={(r) => (
          <>
            <button onClick={() => { setEditing(r); setFormOpen(true); }} className="btn-icon" title="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleteTarget(r)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      />
      <FormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit}
        title={editing ? 'Edit Registration' : 'Add Registration'} fields={getFormFields()}
        initialData={editing ? { registrationNumber: editing.registrationNumber, vehicleId: editing.vehicleId, expirationDate: editing.expirationDate?.split('T')[0] || '' } : undefined}
        submitLabel={editing ? 'Update' : 'Create'} size="md"
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Registration" message={deleteTarget ? `Delete registration "${deleteTarget.registrationNumber}"?` : ''}
      />
    </div>
  );
}
