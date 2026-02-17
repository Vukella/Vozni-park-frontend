import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, SearchInput } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { vehicleModelApi, brandApi } from '../../api/endpoints';
import type { VehicleModelResponse, BrandResponse } from '../../types';

export function VehicleModelsPage() {
  const toast = useToast();
  const { data: models, loading, refresh } = useApiData(() => vehicleModelApi.getAll());
  const { data: brands } = useApiData(() => brandApi.getAll());

  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleModelResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleModelResponse | null>(null);

  const filtered = useMemo(() => {
    let result = models;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.modelName?.toLowerCase().includes(q) ||
          m.brand?.brandName?.toLowerCase().includes(q)
      );
    }
    if (brandFilter) {
      result = result.filter((m) => String(m.brand?.idBrand) === brandFilter);
    }
    return result;
  }, [models, search, brandFilter]);

  const columns: Column<VehicleModelResponse>[] = useMemo(
    () => [
      { key: 'idVehicleModel', header: 'ID', sortable: true },
      {
        key: 'modelName',
        header: 'Model Name',
        sortable: true,
        render: (m) => <span className="font-medium text-gray-900">{m.modelName}</span>,
      },
      {
        key: 'brand.brandName',
        header: 'Brand',
        sortable: true,
        render: (m) => m.brand?.brandName || '—',
      },
    ],
    []
  );

  const getFormFields = useCallback(
    (): FormField[] => [
      { key: 'modelName', label: 'Model Name', type: 'text', required: true, placeholder: 'e.g. Corolla' },
      {
        key: 'brandId',
        label: 'Brand',
        type: 'select',
        required: true,
        options: brands.map((b: BrandResponse) => ({ value: b.idBrand, label: b.brandName })),
      },
    ],
    [brands]
  );

  async function handleSubmit(formData: Record<string, unknown>) {
    const data = { modelName: String(formData.modelName), brandId: Number(formData.brandId) };
    if (editing) {
      await vehicleModelApi.update(editing.idVehicleModel, data);
      toast.success('Model updated.');
    } else {
      await vehicleModelApi.create(data);
      toast.success('Model created.');
    }
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await vehicleModelApi.delete(deleteTarget.idVehicleModel);
    toast.success('Model deleted.');
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Vehicle Models"
        description={`${filtered.length} model${filtered.length !== 1 ? 's' : ''}`}
        action={<button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add Model</button>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search models..." className="w-full sm:w-72" />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="input-field w-auto">
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.idBrand} value={b.idBrand}>{b.brandName}</option>
            ))}
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={filtered} keyExtractor={(m) => m.idVehicleModel} loading={loading} emptyMessage="No models found."
        actions={(m) => (
          <>
            <button onClick={() => { setEditing(m); setFormOpen(true); }} className="btn-icon" title="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleteTarget(m)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      />
      <FormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit}
        title={editing ? 'Edit Model' : 'Add Model'} fields={getFormFields()}
        initialData={editing ? { modelName: editing.modelName, brandId: editing.brand?.idBrand || '' } : undefined}
        submitLabel={editing ? 'Update' : 'Create'} size="sm"
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Model" message={deleteTarget ? `Delete "${deleteTarget.modelName}"?` : ''}
      />
    </div>
  );
}
