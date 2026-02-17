import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  DataTable,
  FormModal,
  ConfirmDialog,
  PageHeader,
  SearchInput,
} from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { roleApi } from '../../api/endpoints';
import type { Role } from '../../types';

export function RolesPage() {
  const toast = useToast();
  const { data: roles, loading, refresh } = useApiData(() => roleApi.getAll());

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const filtered = useMemo(() => {
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter((r) => r.name?.toLowerCase().includes(q));
  }, [roles, search]);

  const columns: Column<Role>[] = useMemo(
    () => [
      {
        key: 'idRole',
        header: 'ID',
        sortable: true,
      },
      {
        key: 'name',
        header: 'Role Name',
        sortable: true,
        render: (r) => {
          const badgeClass = r.name === 'SUPER_ADMIN' ? 'badge-blue' : 'badge-green';
          return <span className={badgeClass}>{r.name.replace('_', ' ')}</span>;
        },
      },
    ],
    []
  );

  const formFields: FormField[] = [
    { key: 'name', label: 'Role Name', type: 'text', required: true, placeholder: 'e.g. FLEET_MANAGER', helpText: 'Use UPPER_CASE with underscores' },
  ];

  async function handleSubmit(formData: Record<string, unknown>) {
    await roleApi.create({ name: String(formData.name) });
    toast.success('Role created.');
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await roleApi.delete(deleteTarget.idRole);
    toast.success('Role deleted.');
    refresh();
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        description={`${filtered.length} role${filtered.length !== 1 ? 's' : ''} · SUPER_ADMIN only`}
        action={
          <button className="btn-primary" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Add Role
          </button>
        }
      />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search roles..." className="w-full sm:w-64" />
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(r) => r.idRole}
        loading={loading}
        emptyMessage="No roles found."
        actions={(r) => (
          <button onClick={() => setDeleteTarget(r)} className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
        )}
      />
      <FormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        title="Add Role"
        fields={formFields}
        submitLabel="Create"
        size="sm"
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={deleteTarget ? `Delete role "${deleteTarget.name}"? Users with this role will lose access.` : ''}
      />
    </div>
  );
}
