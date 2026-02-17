import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable, FormModal, ConfirmDialog, PageHeader, SearchInput } from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { brandApi } from '../../api/endpoints';
import type { BrandResponse } from '../../types';

export function BrandsPage() {
  const toast = useToast();
  const { data: brands, loading, refresh } = useApiData(() => brandApi.getAll());

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BrandResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrandResponse | null>(null);

  const filtered = useMemo(() => {
    if (!search) return brands;
    return brands.filter((b) => b.brandName?.toLowerCase().includes(search.toLowerCase()));
  }, [brands, search]);

  const columns: Column<BrandResponse>[] = useMemo(
    () => [
      { key: 'idBrand', header: 'ID', sortable: true },
      {
        key: 'brandName',
        header: 'Brand Name',
        sortable: true,
        render: (b) => <span className="font-medium text-gray-900">{b.brandName}</span>,
      },
      { key: 'modelCount', header: 'Models', sortable: true, render: (b) => b.modelCount ?? '—' },
    ],
    []
  );

  const formFields: FormField[] = [
    { key: 'brandName', label: 'Brand Name', type: 'text', required: true, placeholder: 'e.g. Toyota' },
  ];

  async function handleSubmit(formData: Record<string, unknown>) {
    const data = { brandName: String(formData.brandName) };
    if (editing) {
      await brandApi.update(editing.idBrand, data);
      toast.success('Brand updated.');
    } else {
      await brandApi.create(data);
      toast.success('Brand created.');
    }
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await brandApi.delete(deleteTarget.idBrand);
    toast.success('Brand deleted.');
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Brands"
        description={`${filtered.length} brand${filtered.length !== 1 ? 's' : ''}`}
        action={<button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Add Brand</button>}
      />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search brands..." className="w-full sm:w-64" />
      </div>
      <DataTable columns={columns} data={filtered} keyExtractor={(b) => b.idBrand} loading={loading} emptyMessage="No brands found."
        actions={(b) => (
          <>
            <button onClick={() => { setEditing(b); setFormOpen(true); }} className="btn-icon" title="Edit"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setDeleteTarget(b)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
          </>
        )}
      />
      <FormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={handleSubmit}
        title={editing ? 'Edit Brand' : 'Add Brand'} fields={formFields}
        initialData={editing ? { brandName: editing.brandName } : undefined}
        submitLabel={editing ? 'Update' : 'Create'} size="sm"
      />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Brand" message={deleteTarget ? `Delete "${deleteTarget.brandName}"? Associated vehicle models will also be affected.` : ''}
      />
    </div>
  );
}
