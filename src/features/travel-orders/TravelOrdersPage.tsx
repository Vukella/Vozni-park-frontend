import { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
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
import { travelOrderApi, driverApi, vehicleApi, locationApi } from '../../api/endpoints';
import { formatDate } from '../../utils/format';
import type {
  TravelOrderResponse,
  TravelOrderRequest,
} from '../../types';

// ============================================
// Status options
// ============================================

const STATUS_OPTIONS = [
  { value: 'CREATED', label: 'Created' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// ============================================
// Component
// ============================================

export function TravelOrdersPage() {
  const toast = useToast();

  // Data fetching
  const { data: orders, loading, refresh } = useApiData(() => travelOrderApi.getAll());
  const { data: drivers } = useApiData(() => driverApi.getAvailable());
  const { data: vehicles } = useApiData(() => vehicleApi.getAvailable());
  const { data: locations } = useApiData(() => locationApi.getAll());

  // UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<TravelOrderResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TravelOrderResponse | null>(null);

  // Complete order state
  const [completeTarget, setCompleteTarget] = useState<TravelOrderResponse | null>(null);
  const [completeFormOpen, setCompleteFormOpen] = useState(false);

  // Cancel order state
  const [cancelTarget, setCancelTarget] = useState<TravelOrderResponse | null>(null);

  // Filter orders
  // FIXED: removed destination/purpose from search — those fields don't exist
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
          (o) =>
              o.travelOrderNumber?.toLowerCase().includes(q) ||
              o.workOrderNumber?.toLowerCase().includes(q) ||
              o.drivers?.some((d) => (d.fullName ?? '').toLowerCase().includes(q)) ||
              o.vehicles?.some((v) => String(v.sapNumber).includes(q))
      );
    }

    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }

    return result;
  }, [orders, search, statusFilter]);

  // Table columns
  // FIXED: removed Destination column — field doesn't exist in DB
  const columns: Column<TravelOrderResponse>[] = useMemo(
      () => [
        {
          key: 'travelOrderNumber',
          header: 'Order #',
          sortable: true,
          render: (o) => (
              <span className="font-medium text-gray-900">{o.travelOrderNumber}</span>
          ),
        },
        {
          key: 'workOrderNumber',
          header: 'Work Order #',
          sortable: true,
          render: (o) => o.workOrderNumber || '—',
        },
        {
          key: 'dateFrom',
          header: 'Departure',
          sortable: true,
          render: (o) => formatDate(o.dateFrom),
        },
        {
          key: 'dateTo',
          header: 'Return',
          sortable: true,
          render: (o) => formatDate(o.dateTo),
        },
        {
          key: 'drivers',
          header: 'Drivers',
          render: (o) =>
              o.drivers?.length
                  ? o.drivers.map((d) => d.fullName ?? `SAP #${d.sapNumber}`).join(', ')
                  : '—',
        },
        {
          key: 'vehicles',
          header: 'Vehicles',
          render: (o) =>
              o.vehicles?.length
                  ? o.vehicles.map((v) => `SAP #${v.sapNumber}`).join(', ')
                  : '—',
        },
        {
          key: 'startingMileage',
          header: 'Start km',
          sortable: true,
          render: (o) => o.startingMileage?.toLocaleString() || '—',
        },
        {
          key: 'endingMileage',
          header: 'End km',
          sortable: true,
          render: (o) => o.endingMileage?.toLocaleString() || '—',
        },
        {
          key: 'location.locationName',
          header: 'Location',
          sortable: true,
          render: (o) => o.location?.locationName || '—',
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          render: (o) => <StatusBadge status={o.status} />,
        },
      ],
      []
  );

  // Form fields
  // FIXED: removed destination, purpose, notes — not in DB
  const getFormFields = useCallback(
      (): FormField[] => [
        {
          key: 'locationId',
          label: 'Location',
          type: 'select',
          required: true,
          options: locations.map((l) => ({
            value: l.idLocationUnit,
            label: l.locationName,
          })),
        },
        {
          key: 'workOrderNumber',
          label: 'Work Order Number',
          type: 'text',
          required: true,
          placeholder: 'e.g. RN-2026-0001',
          colSpan: 2,
        },
        {
          key: 'dateFrom',
          label: 'Departure Date',
          type: 'date',
          required: true,
        },
        {
          key: 'dateTo',
          label: 'Return Date',
          type: 'date',
          required: true,
        },
        {
          key: 'driverIds',
          label: 'Drivers',
          type: 'select',
          required: true,
          multiple: true,
          options: drivers.map((d) => ({
            value: d.idDriver,
            label: d.fullName ?? `SAP #${d.sapNumber}`,
          })),
          colSpan: 2,
        },
        {
          key: 'vehicleIds',
          label: 'Vehicles',
          type: 'select',
          required: true,
          multiple: true,
          options: vehicles.map((v) => ({
            value: v.idVehicle,
            label: `SAP #${v.sapNumber}`,
          })),
          colSpan: 2,
        },
        {
          key: 'startingMileage',
          label: 'Starting Mileage (km)',
          type: 'number',
          required: true,
          min: 0,
          placeholder: 'e.g. 45000',
        },
      ],
      [locations, drivers, vehicles]
  );

  // Complete form fields
  const completeFields: FormField[] = [
    {
      key: 'endingMileage',
      label: 'Ending Mileage (km)',
      type: 'number',
      required: true,
      min: completeTarget?.startingMileage || 0,
      placeholder: `Must be ≥ ${completeTarget?.startingMileage || 0}`,
      helpText: `Starting mileage was ${completeTarget?.startingMileage?.toLocaleString() || '—'} km`,
    },
  ];

  // Handlers
  function handleCreate() {
    setEditingOrder(null);
    setFormOpen(true);
  }

  function handleEdit(order: TravelOrderResponse) {
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      toast.warning('Cannot edit a completed or cancelled order.');
      return;
    }
    setEditingOrder(order);
    setFormOpen(true);
  }

  // FIXED: removed destination, purpose, notes from request
  async function handleSubmit(formData: Record<string, unknown>) {
    const dateOnly = (v: unknown) => {
      if (!v) return undefined;
      const s = String(v);
      return s.length >= 10 ? s.slice(0, 10) : s;
    };

    const request: TravelOrderRequest = {
      locationId: Number(formData.locationId),
      workOrderNumber: String(formData.workOrderNumber),
      dateFrom: dateOnly(formData.dateFrom)!,
      dateTo: dateOnly(formData.dateTo)!,
      startingMileage: Number(formData.startingMileage),
      driverIds: Array.isArray(formData.driverIds)
          ? (formData.driverIds as unknown[]).map(Number)
          : [],
      vehicleIds: Array.isArray(formData.vehicleIds)
          ? (formData.vehicleIds as unknown[]).map(Number)
          : [],
    };

    if (editingOrder) {
      await travelOrderApi.update(editingOrder.idTravelOrder, request);
      toast.success('Travel order updated successfully.');
    } else {
      await travelOrderApi.create(request);
      toast.success('Travel order created successfully.');
    }
    refresh();
  }

  async function handleComplete(formData: Record<string, unknown>) {
    if (!completeTarget) return;
    await travelOrderApi.complete(completeTarget.idTravelOrder, Number(formData.endingMileage));
    toast.success('Travel order completed successfully.');
    setCompleteTarget(null);
    setCompleteFormOpen(false);
    refresh();
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    // FIXED: endpoint is now PATCH /travel-orders/{id}/cancel (fixed in endpoints.ts)
    await travelOrderApi.cancel(cancelTarget.idTravelOrder);
    toast.success('Travel order cancelled.');
    setCancelTarget(null);
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await travelOrderApi.delete(deleteTarget.idTravelOrder);
    toast.success('Travel order deleted successfully.');
    refresh();
  }

  // FIXED: removed destination, purpose, notes from initial data
  function getEditInitialData(): Record<string, unknown> | undefined {
    if (!editingOrder) return undefined;

    const formatForInput = (dateStr: string | null | undefined) => {
      if (!dateStr) return '';
      try {
        return new Date(dateStr).toISOString().slice(0, 10);
      } catch {
        return '';
      }
    };

    return {
      locationId: editingOrder.location?.idLocationUnit || '',
      workOrderNumber: editingOrder.workOrderNumber ?? '',
      dateFrom: formatForInput(editingOrder.dateFrom),
      dateTo: formatForInput(editingOrder.dateTo),
      startingMileage: editingOrder.startingMileage,
      driverIds: editingOrder.drivers?.map((d) => d.idDriver) ?? [],
      vehicleIds: editingOrder.vehicles?.map((v) => v.idVehicle) ?? [],
    };
  }

  function canComplete(order: TravelOrderResponse) {
    return order.status === 'CREATED' || order.status === 'IN_PROGRESS';
  }

  function canCancel(order: TravelOrderResponse) {
    return order.status === 'CREATED' || order.status === 'IN_PROGRESS';
  }

  function canEdit(order: TravelOrderResponse) {
    return order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
  }

  function canDelete(order: TravelOrderResponse) {
    return order.status === 'CREATED';
  }

  return (
      <div>
        <PageHeader
            title="Travel Orders"
            description={`${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} found`}
            action={
              <button className="btn-primary" onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                New Travel Order
              </button>
            }
        />

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by order #, work order #, driver, vehicle..."
              className="w-full sm:w-96"
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
            data={filteredOrders}
            keyExtractor={(o) => o.idTravelOrder}
            loading={loading}
            emptyMessage="No travel orders found. Create your first travel order."
            actions={(order) => (
                <>
                  {canComplete(order) && (
                      <button
                          onClick={() => {
                            setCompleteTarget(order);
                            setCompleteFormOpen(true);
                          }}
                          className="btn-icon text-green-500 hover:text-green-700 hover:bg-green-50"
                          title="Complete order"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                  )}
                  {canCancel(order) && (
                      <button
                          onClick={() => setCancelTarget(order)}
                          className="btn-icon text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                          title="Cancel order"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                  )}
                  {canEdit(order) && (
                      <button
                          onClick={() => handleEdit(order)}
                          className="btn-icon"
                          title="Edit order"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                  )}
                  {canDelete(order) && (
                      <button
                          onClick={() => setDeleteTarget(order)}
                          className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                  )}
                </>
            )}
        />

        {/* Create/Edit Modal */}
        <FormModal
            open={formOpen}
            onClose={() => {
              setFormOpen(false);
              setEditingOrder(null);
            }}
            onSubmit={handleSubmit}
            title={editingOrder ? 'Edit Travel Order' : 'New Travel Order'}
            fields={getFormFields()}
            initialData={getEditInitialData()}
            submitLabel={editingOrder ? 'Update Order' : 'Create Order'}
            size="lg"
        />

        {/* Complete Order Modal */}
        <FormModal
            open={completeFormOpen}
            onClose={() => {
              setCompleteFormOpen(false);
              setCompleteTarget(null);
            }}
            onSubmit={handleComplete}
            title={`Complete Order ${completeTarget?.travelOrderNumber || ''}`}
            fields={completeFields}
            submitLabel="Complete Order"
            size="sm"
        />

        {/* Cancel Confirmation */}
        <ConfirmDialog
            open={!!cancelTarget}
            onClose={() => setCancelTarget(null)}
            onConfirm={handleCancel}
            title="Cancel Travel Order"
            message={
              cancelTarget
                  ? `Are you sure you want to cancel order ${cancelTarget.travelOrderNumber}? This will mark it as cancelled.`
                  : ''
            }
            confirmLabel="Cancel Order"
            variant="warning"
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Delete Travel Order"
            message={
              deleteTarget
                  ? `Are you sure you want to delete order ${deleteTarget.travelOrderNumber}? This action cannot be undone.`
                  : ''
            }
        />
      </div>
  );
}