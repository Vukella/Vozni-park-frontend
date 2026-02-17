import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  DataTable,
  FormModal,
  ConfirmDialog,
  PageHeader,
  SearchInput,
} from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { locationApi } from '../../api/endpoints';
import type { LocationUnitResponse } from '../../types';

export function LocationsPage() {
  const toast = useToast();
  const { data: locations, loading, refresh } = useApiData(() => locationApi.getAll());

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LocationUnitResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocationUnitResponse | null>(null);

  const filtered = useMemo(() => {
    if (!search) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (l) =>
        l.locationName?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q)
    );
  }, [locations, search]);

  const columns: Column<LocationUnitResponse>[] = useMemo(
    () => [
      {
        key: 'locationName',
        header: 'Location Name',
        sortable: true,
        render: (l) => <span className="font-medium text-gray-900">{l.locationName}</span>,
      },
      { key: 'address', header: 'Address', sortable: true, render: (l) => l.address || '—' },
      { key: 'city', header: 'City', sortable: true, render: (l) => l.city || '—' },
      { key: 'vehicleCount', header: 'Vehicles', sortable: true },
      { key: 'driverCount', header: 'Drivers', sortable: true },
    ],
    []
  );

  const formFields: FormField[] = [
    { key: 'locationName', label: 'Location Name', type: 'text', required: true, placeholder: 'e.g. Belgrade HQ' },
    { key: 'address', label: 'Address', type: 'text', placeholder: 'e.g. Knez Mihailova 10' },
    { key: 'city', label: 'City', type: 'text', placeholder: 'e.g. Belgrade' },
  ];

  async function handleSubmit(formData: Record<string, unknown>) {
    const data = {
      locationName: String(formData.locationName),
      address: formData.address ? String(formData.address) : undefined,
      city: formData.city ? String(formData.city) : undefined,
    };
    if (editing) {
      await locationApi.update(editing.idLocationUnit, data);
      toast.success('Location updated.');
    } else {
      await locationApi.create(data);
      toast.success('Location created.');
    }
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await locationApi.delete(deleteTarget.idLocationUnit);
    toast.success('Location deleted.');
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        description={`${filtered.length} location${filtered.length !== 1 ? 's' : ''}`}
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Location
          </button>
        }
      />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search locations..." className="w-full sm:w-80" />
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(l) => l.idLocationUnit}
        loading={loading}
        emptyMessage="No locations found."
        actions={(l) => (
          <>
            <button onClick={() => { setEditing(l); setFormOpen(true); }} className="btn-icon" title="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleteTarget(l)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      />
      <FormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        title={editing ? 'Edit Location' : 'Add Location'}
        fields={formFields}
        initialData={editing ? { locationName: editing.locationName, address: editing.address || '', city: editing.city || '' } : undefined}
        submitLabel={editing ? 'Update' : 'Create'}
        size="md"
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Location"
        message={deleteTarget ? `Delete "${deleteTarget.locationName}"? Vehicles and drivers assigned here will become unassigned.` : ''}
      />
    </div>
  );
}
