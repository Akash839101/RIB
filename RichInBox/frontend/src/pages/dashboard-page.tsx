import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../lib/api-client';
import { useAuth } from '../context/auth-context';
import { useToast } from '../components/toast-provider';
import { Header } from '../components/app-header';
import { Button } from '../components/button';
import { Input } from '../components/form-field';
import { EmailsTable } from '../components/emails-table';
import { EmptyState } from '../components/empty-state';
import { ComposeModal } from '../components/compose-modal';
import type { EmailRow } from '../shared-types';

type Tab = 'scheduled' | 'sent';

interface SlackState {
  connected: boolean;
  teamName: string | null;
  channelName: string | null;
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const [params, setParams] = useSearchParams();

  const [tab, setTab] = useState<Tab>('scheduled');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [slack, setSlack] = useState<SlackState>({ connected: false, teamName: null, channelName: null });

  const load = useCallback(
    async (which: Tab, searchTerm: string, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await api.emails({ tab: which, search: searchTerm || undefined });
        setRows(res.items);
      } catch (err) {
        notify(err instanceof ApiError ? err.message : 'Failed to load emails', 'error');
      } finally {
        setLoading(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    void load(tab, search);
  }, [tab, load]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.slackStatus().then(setSlack).catch(() => undefined);
  }, []);

  useEffect(() => {
    const status = params.get('slack');
    if (status === 'connected') notify('Slack connected', 'success');
    else if (status === 'error') notify('Slack connection failed', 'error');
    else if (status === 'denied') notify('Slack connection denied', 'error');
    if (status) {
      api.slackStatus().then(setSlack).catch(() => undefined);
      params.delete('slack');
      setParams(params, { replace: true });
    }
  }, [params, setParams, notify]);

  useEffect(() => {
    const id = setInterval(() => void load(tab, search, true), 8000);
    return () => clearInterval(id);
  }, [tab, search, load]);

  const onSearch = (value: string) => {
    setSearch(value);
    void load(tab, value);
  };

  const cancel = async (id: string) => {
    try {
      await api.cancelEmail(id);
      notify('Email cancelled', 'success');
      void load(tab, search, true);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Cancel failed', 'error');
    }
  };

  const connectSlack = () => {
    window.location.href = api.slackConnectUrl();
  };

  const testSlack = async () => {
    try {
      await api.slackTest();
      notify('Test message sent to Slack', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Slack test failed', 'error');
    }
  };

  const disconnectSlack = async () => {
    await api.slackUnsubscribe();
    setSlack({ connected: false, teamName: null, channelName: null });
    notify('Slack disconnected', 'success');
  };

  if (!user) return null;

  return (
    <div className="flex min-h-full flex-col">
      <Header user={user} onLogout={() => void logout()} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand">Your workspace</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Email activity</h1>
            <p className="mt-1 text-sm text-slate-500">Schedule, monitor, and search your outreach.</p>
          </div>
          <div className="flex items-center gap-2">
            {slack.connected ? (
              <>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  Slack: {slack.teamName ?? 'connected'}
                </span>
                <Button variant="secondary" size="sm" onClick={testSlack}>
                  Test
                </Button>
                <Button variant="ghost" size="sm" onClick={disconnectSlack}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={connectSlack}>
                Connect Slack
              </Button>
            )}
            <Button onClick={() => setComposeOpen(true)}>Compose New Email</Button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.03] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(['scheduled', 'sent'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === t ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                aria-pressed={tab === t}
              >
                {t} emails
              </button>
            ))}
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search emails…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(search)}
            />
          </div>
        </div>

        {loading ? (
          <EmailsTable rows={[]} loading tab={tab} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={tab === 'scheduled' ? 'No scheduled emails yet' : 'No sent emails yet'}
            description={
              tab === 'scheduled'
                ? 'Compose a new email to schedule your first outreach.'
                : 'Emails you send will appear here with their delivery status.'
            }
            action={
              tab === 'scheduled' ? (
                <Button size="sm" onClick={() => setComposeOpen(true)}>
                  Compose New Email
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EmailsTable rows={rows} loading={false} tab={tab} onCancel={cancel} />
        )}
        </section>
      </main>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onScheduled={() => {
          setTab('scheduled');
          void load('scheduled', search, true);
        }}
      />
    </div>
  );
}
