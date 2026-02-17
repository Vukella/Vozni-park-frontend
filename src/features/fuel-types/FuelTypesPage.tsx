import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, SearchInput } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { fuelTypeApi } from '../../api/endpoints';
import type { FuelType } from '../../types';

export function FuelTypesPage() {
  const toast = useToast();
  const { data: fuelTypes, loading, refresh } = useApiData(() => fuelTypeApi.getAll());

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FuelType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FuelType | null>(null);

  const filtered = useMemo(() => {
    if (!search) return fuelTypes;
    return fuelTypes.filter((f) => f.fuelName?.toLowerCase().includes(search.toLowerCase()));
  }, [fuelTypes, search]);

  const columns: Column<FuelType>[] = useMemo(
    () => [
      { key: 'idFuelType', header: 'ID', sortable: true },
      { key: 'fuelName', header: 'Fuel Name', sortable: true, render: (f) => <span className="font-medium text-gray-900">{f.fuelName}</span> },
    ],
    []
  );

  const formFields: FormField[] = [
    { key: 'fuelName', label: 'Fuel Name', type: 'text', required: true, placeholder: 'e.g. Diesel' },
  ];

  async function handleSubmit(formData: Record<string, unknown>) {
    const data = { fuelName: String(formData.fuelName) };
    if (editing) {
      await fuelTypeApi.update(editing.idFuelType, data);
      toast.success('Fuel type updated.');
    } else {
      await fuelTypeApi.create(data);
      toast.success('Fuel type created.');
    }
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await fuelTypeApi.delete(deleteTarget.idFuelType);
    toast.success('Fuel type deleted.');
    refresh();
  }

  return (
    <div>
      <PageHeader title="Fuel Types" description={`${filtered.length} fuel type${filtered.length !== 1 ? 's' : ''}`}
        action={<button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add Fuel Type</button>}
      />
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search fuel types..." className="w-full sm:w-64" /></div>
      <DataTable columns={columns} data={filtered} keyExtractor={(f) => f.idFuelType} loading={loading} emptyMessage="No fuel types found."
        actions={(f) => (
          <>
            <button onClick={() => { setEditing(f); setFormOpen(true); }} className="btn-icon" title="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleteTarget(f)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      />
      <FormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit}
        title={editing ? 'Edit Fuel Type' : 'Add Fuel Type'} fields={formFields}
        initialData={editing ? { fuelName: editing.fuelName } : undefined}
        submitLabel={editing ? 'Update' : 'Create'} size="sm"
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Fuel Type" message={deleteTarget ? `Delete "${deleteTarget.fuelName}"?` : ''}
      />
    </div>
  );
}
