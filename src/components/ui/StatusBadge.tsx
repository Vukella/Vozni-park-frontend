import { getStatusBadgeClass, formatStatus } from '../../utils/format';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`${getStatusBadgeClass(status)} ${className}`}>
      {formatStatus(status)}
    </span>
  );
}
