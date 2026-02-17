import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
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
import { driverApi } from '../../api/endpoints';
import type { DriverResponse, DriverRequest } from '../../types';

// ============================================
// Status options
// ============================================

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

// ============================================
// Component
// ============================================

export function DriversPage() {
  const toast = useToast();
  const { data: drivers, loading, refresh } = useApiData(() => driverApi.getAll());

  // UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriverResponse | null>(null);

  // Filter drivers
  const filteredDrivers = useMemo(() => {
    let result = drivers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          String(d.sapNumber).includes(q) ||
          d.firstName?.toLowerCase().includes(q) ||
          d.lastName?.toLowerCase().includes(q) ||
          d.phoneNumber?.toLowerCase().includes(q) ||
          d.driversLicense?.licenseNumber?.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((d) => d.status === statusFilter);
    }

    return result;
  }, [drivers, search, statusFilter]);

  // Table columns
  const columns: Column<DriverResponse>[] = useMemo(
    () => [
      {
        key: 'sapNumber',
        header: 'SAP #',
        sortable: true,
        render: (d) => <span className="font-medium text-gray-900">{d.sapNumber}</span>,
      },
      {
        key: 'firstName',
        header: 'First Name',
        sortable: true,
      },
      {
        key: 'lastName',
        header: 'Last Name',
        sortable: true,
      },
      {
        key: 'phoneNumber',
        header: 'Phone',
        render: (d) => d.phoneNumber || '—',
      },
      {
        key: 'driversLicense.licenseNumber',
        header: 'License #',
        render: (d) => d.driversLicense?.licenseNumber || '—',
      },
      {
        key: 'driversLicense.categories',
        header: 'Categories',
        render: (d) =>
          d.driversLicense?.categories?.length
            ? d.driversLicense.categories.join(', ')
            : '—',
      },
      {
        key: 'locationUnit.locationName',
        header: 'Location',
        sortable: true,
        render: (d) => d.locationUnit?.locationName || 'Unassigned',
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (d) => <StatusBadge status={d.status} />,
      },
    ],
    []
  );

  // Form fields
  const formFields: FormField[] = [
    {
      key: 'sapNumber',
      label: 'SAP Number',
      type: 'number',
      required: true,
      placeholder: 'e.g. 999001',
      min: 1,
    },
    {
      key: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Marko',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Petrović',
    },
    {
      key: 'phoneNumber',
      label: 'Phone Number',
      type: 'text',
      placeholder: 'e.g. +381 64 1234567',
      helpText: 'Serbian format: +381 XX XXXXXXX',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: STATUS_OPTIONS,
    },
  ];

  // Handlers
  function handleCreate() {
    setEditingDriver(null);
    setFormOpen(true);
  }

  function handleEdit(driver: DriverResponse) {
    setEditingDriver(driver);
    setFormOpen(true);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    const request: DriverRequest = {
      sapNumber: Number(formData.sapNumber),
      firstName: String(formData.firstName),
      lastName: String(formData.lastName),
      phoneNumber: formData.phoneNumber ? String(formData.phoneNumber) : undefined,
      status: String(formData.status),
    };

    if (editingDriver) {
      await driverApi.update(editingDriver.idDriver, request);
      toast.success('Driver updated successfully.');
    } else {
      await driverApi.create(request);
      toast.success('Driver created successfully.');
    }
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await driverApi.delete(deleteTarget.idDriver);
    toast.success('Driver deleted successfully.');
    refresh();
  }

  function getEditInitialData(): Record<string, unknown> | undefined {
    if (!editingDriver) return undefined;
    return {
      sapNumber: editingDriver.sapNumber,
      firstName: editingDriver.firstName,
      lastName: editingDriver.lastName,
      phoneNumber: editingDriver.phoneNumber || '',
      status: editingDriver.status,
    };
  }

  return (
    <div>
      <PageHeader
        title="Drivers"
        description={`${filteredDrivers.length} driver${filteredDrivers.length !== 1 ? 's' : ''} found`}
        action={
          <button className="btn-primary" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Add Driver
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by SAP, name, phone, license..."
          className="w-full sm:w-80"
        />
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredDrivers}
        keyExtractor={(d) => d.idDriver}
        loading={loading}
        emptyMessage="No drivers found. Try adjusting your search or add a new driver."
        actions={(driver) => (
          <>
            <button onClick={() => handleEdit(driver)} className="btn-icon" title="Edit driver">
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(driver)}
              className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
              title="Delete driver"
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
          setEditingDriver(null);
        }}
        onSubmit={handleSubmit}
        title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
        fields={formFields}
        initialData={getEditInitialData()}
        submitLabel={editingDriver ? 'Update Driver' : 'Create Driver'}
        size="md"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Driver"
        message={
          deleteTarget
            ? `Are you sure you want to delete driver ${deleteTarget.firstName} ${deleteTarget.lastName} (SAP #${deleteTarget.sapNumber})? This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}
