import type { EmailRow } from '../shared-types';
import { StatusBadge } from './status-badge';
import { Button, Spinner } from './button';

interface Props {
  rows: EmailRow[];
  loading: boolean;
  tab: 'scheduled' | 'sent';
  onCancel?: (id: string) => void;
}

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function EmailsTable({ rows, loading, tab, onCancel }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Subject</th>
            <th className="px-4 py-3 font-medium">{tab === 'sent' ? 'Sent time' : 'Scheduled time'}</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {tab === 'scheduled' && <th className="px-4 py-3" />}
            {tab === 'sent' && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Spinner size={16} /> Loading emails…
                </span>
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-violet-50/40">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.toEmail}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{row.subject}</td>
                <td className="px-4 py-3 text-slate-500">
                  {tab === 'sent' ? fmt(row.sentAt) : fmt(row.scheduledAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                {tab === 'scheduled' && (
                  <td className="px-4 py-3 text-right">
                    {onCancel && row.status !== 'CANCELLED' && (
                      <Button variant="ghost" size="sm" onClick={() => onCancel(row.id)}>
                        Cancel
                      </Button>
                    )}
                  </td>
                )}
                {tab === 'sent' && (
                  <td className="px-4 py-3 text-right">
                    {row.previewUrl && (
                      <a
                        href={row.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Preview
                      </a>
                    )}
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
