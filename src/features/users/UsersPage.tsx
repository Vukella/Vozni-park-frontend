import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Key, Filter } from 'lucide-react';
import {
  DataTable,
  FormModal,
  ConfirmDialog,
  PageHeader,
  StatusBadge,
  SearchInput,
} from '../../components';
import type { Column, FormField } from '../../components';
import { useApiData, useToast } from '../../hooks';
import { userApi, roleApi, locationApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import type { AppUserResponse, AppUserRequest } from '../../types';

// ============================================
// Component
// ============================================

export function UsersPage() {
  const toast = useToast();

  // Data fetching
  const { data: users, loading, refresh } = useApiData(() => userApi.getAll());
  const { data: roles } = useApiData(() => roleApi.getAll());
  const { data: locations } = useApiData(() => locationApi.getAll());

  // UI state
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUserResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppUserResponse | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AppUserResponse | null>(null);
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);

  // Filter users
  const filteredUsers = useMemo(() => {
    let result = users;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(q) ||
          u.fullName?.toLowerCase().includes(q) ||
          u.role?.name?.toLowerCase().includes(q)
      );
    }

    if (activeFilter !== '') {
      const isActive = activeFilter === 'true';
      result = result.filter((u) => u.isActive === isActive);
    }

    return result;
  }, [users, search, activeFilter]);

  // Table columns
  const columns: Column<AppUserResponse>[] = useMemo(
    () => [
      {
        key: 'username',
        header: 'Username',
        sortable: true,
        render: (u) => <span className="font-medium text-gray-900">@{u.username}</span>,
      },
      {
        key: 'fullName',
        header: 'Full Name',
        sortable: true,
      },
      {
        key: 'role.name',
        header: 'Role',
        sortable: true,
        render: (u) => {
          const roleName = u.role?.name || 'Unknown';
          const badgeClass = roleName === 'SUPER_ADMIN' ? 'badge-blue' : 'badge-green';
          return <span className={badgeClass}>{roleName.replace('_', ' ')}</span>;
        },
      },
      {
        key: 'locations',
        header: 'Locations',
        render: (u) =>
          u.locations?.length
            ? u.locations.map((l) => l.locationName).join(', ')
            : '—',
      },
      {
        key: 'failedLoginAttempts',
        header: 'Failed Logins',
        sortable: true,
        render: (u) => {
          if (u.failedLoginAttempts >= 5) {
            return <span className="badge-red">{u.failedLoginAttempts} (locked)</span>;
          }
          return u.failedLoginAttempts || 0;
        },
      },
      {
        key: 'lastSuccessfulLogin',
        header: 'Last Login',
        sortable: true,
        render: (u) => formatDate(u.lastSuccessfulLogin),
      },
      {
        key: 'isActive',
        header: 'Status',
        sortable: true,
        render: (u) => <StatusBadge status={u.isActive ? 'Active' : 'Inactive'} />,
      },
    ],
    []
  );

  // Create form fields (includes password)
  const getCreateFields = useCallback(
    (): FormField[] => [
      {
        key: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'e.g. jsmith',
        helpText: 'Must be unique, 3-30 characters',
      },
      {
        key: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. John Smith',
      },
      {
        key: 'password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Minimum 6 characters',
      },
      {
        key: 'roleId',
        label: 'Role',
        type: 'select',
        required: true,
        options: roles.map((r) => ({ value: r.idRole, label: r.name.replace('_', ' ') })),
      },
      {
        key: 'isActive',
        label: 'Account Active',
        type: 'checkbox',
      },
    ],
    [roles]
  );

  // Edit form fields (no password)
  const getEditFields = useCallback(
    (): FormField[] => [
      {
        key: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'e.g. jsmith',
      },
      {
        key: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. John Smith',
      },
      {
        key: 'roleId',
        label: 'Role',
        type: 'select',
        required: true,
        options: roles.map((r) => ({ value: r.idRole, label: r.name.replace('_', ' ') })),
      },
      {
        key: 'isActive',
        label: 'Account Active',
        type: 'checkbox',
      },
    ],
    [roles]
  );

  // Password change fields
  const passwordFields: FormField[] = [
    {
      key: 'newPassword',
      label: 'New Password',
      type: 'password',
      required: true,
      placeholder: 'Enter new password',
      helpText: 'Minimum 6 characters',
      colSpan: 2,
    },
  ];

  // Handlers
  function handleCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function handleEdit(user: AppUserResponse) {
    setEditingUser(user);
    setFormOpen(true);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    if (editingUser) {
      // Update without password
      const request: AppUserRequest = {
        username: String(formData.username),
        fullName: String(formData.fullName),
        password: 'placeholder', // Backend should ignore for update
        isActive: Boolean(formData.isActive),
        roleId: Number(formData.roleId),
      };
      await userApi.update(editingUser.idUser, request);
      toast.success('User updated successfully.');
    } else {
      // Create with password
      const request: AppUserRequest = {
        username: String(formData.username),
        fullName: String(formData.fullName),
        password: String(formData.password),
        isActive: Boolean(formData.isActive),
        roleId: Number(formData.roleId),
      };
      await userApi.create(request);
      toast.success('User created successfully.');
    }
    refresh();
  }

  async function handlePasswordChange(formData: Record<string, unknown>) {
    if (!passwordTarget) return;
    await userApi.updatePassword(passwordTarget.idUser, String(formData.newPassword));
    toast.success(`Password updated for ${passwordTarget.username}.`);
    setPasswordTarget(null);
    setPasswordFormOpen(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await userApi.delete(deleteTarget.idUser);
    toast.success('User deleted successfully.');
    refresh();
  }

  function getEditInitialData(): Record<string, unknown> | undefined {
    if (!editingUser) return { isActive: true };
    return {
      username: editingUser.username,
      fullName: editingUser.fullName,
      roleId: editingUser.role?.idRole || '',
      isActive: editingUser.isActive,
    };
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} found · SUPER_ADMIN access only`}
        action={
          <button className="btn-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add User
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by username, name, role..."
          className="w-full sm:w-80"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Users</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.idUser}
        loading={loading}
        emptyMessage="No users found."
        actions={(user) => (
          <>
            <button
              onClick={() => {
                setPasswordTarget(user);
                setPasswordFormOpen(true);
              }}
              className="btn-icon text-amber-500 hover:text-amber-700 hover:bg-amber-50"
              title="Change password"
            >
              <Key className="h-4 w-4" />
            </button>
            <button onClick={() => handleEdit(user)} className="btn-icon" title="Edit user">
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(user)}
              className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
              title="Delete user"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <FormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSubmit}
        title={editingUser ? 'Edit User' : 'Add New User'}
        fields={editingUser ? getEditFields() : getCreateFields()}
        initialData={getEditInitialData()}
        submitLabel={editingUser ? 'Update User' : 'Create User'}
        size="md"
      />

      {/* Password Change Modal */}
      <FormModal
        open={passwordFormOpen}
        onClose={() => {
          setPasswordFormOpen(false);
          setPasswordTarget(null);
        }}
        onSubmit={handlePasswordChange}
        title={`Change Password — @${passwordTarget?.username || ''}`}
        fields={passwordFields}
        submitLabel="Update Password"
        size="sm"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={
          deleteTarget
            ? `Are you sure you want to delete user @${deleteTarget.username} (${deleteTarget.fullName})? This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
