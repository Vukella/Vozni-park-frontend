import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, StatusBadge } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { firstAidKitApi, vehicleApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import type { FirstAidKit } from '../../types';

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
      { key: 'idFirstAidKit', header: 'ID', sortable: true },
      { key: 'vehicleId', header: 'Vehicle (SAP)', sortable: true, render: (k) => {
        const v = vehicles.find((v) => v.idVehicle === k.vehicleId);
        return v ? <span className="font-medium text-gray-900">SAP #{v.sapNumber}</span> : `Vehicle #${k.vehicleId}`;
      }},
      { key: 'expirationDate', header: 'Expires', sortable: true, render: (k) => (
        <span className="flex items-center gap-2">
          {formatDate(k.expirationDate)}
          {isExpired(k.expirationDate) && <StatusBadge status="Expired" />}
        </span>
      )},
    ],
    [vehicles]
  );

  const getFormFields = useCallback(
    (): FormField[] => [
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
      expirationDate: String(formData.expirationDate),
      vehicleId: Number(formData.vehicleId),
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
      <PageHeader title="First Aid Kits" description={`${kits.length} kit${kits.length !== 1 ? 's' : ''}`}
        action={<button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add Kit</button>}
      />
      <DataTable columns={columns} data={kits} keyExtractor={(k) => k.idFirstAidKit} loading={loading} emptyMessage="No first aid kits found."
        actions={(k) => (
          <>
            <button onClick={() => { setEditing(k); setFormOpen(true); }} className="btn-icon" title="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleteTarget(k)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      />
      <FormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit}
        title={editing ? 'Edit First Aid Kit' : 'Add First Aid Kit'} fields={getFormFields()}
        initialData={editing ? { vehicleId: editing.vehicleId, expirationDate: editing.expirationDate?.split('T')[0] || '' } : undefined}
        submitLabel={editing ? 'Update' : 'Create'} size="sm"
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete First Aid Kit" message={deleteTarget ? `Delete this first aid kit?` : ''}
      />
    </div>
  );
}
