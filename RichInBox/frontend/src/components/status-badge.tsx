import type { EmailStatus } from '../shared-types';

const map: Record<EmailStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Scheduled', className: 'bg-indigo-50 text-indigo-700' },
  RATE_LIMITED: { label: 'Rate limited', className: 'bg-amber-50 text-amber-700' },
  SENT: { label: 'Sent', className: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Failed', className: 'bg-red-50 text-red-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-slate-100 text-slate-500' },
};

export function StatusBadge({ status }: { status: EmailStatus }) {
  const s = map[status] ?? map.SCHEDULED;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}
