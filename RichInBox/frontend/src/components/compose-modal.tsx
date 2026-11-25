import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../lib/api-client';
import type { Sender } from '../shared-types';
import { Modal } from './dialog';
import { Button } from './button';
import { Field, Input, Textarea } from './form-field';
import { useToast } from './toast-provider';

const EMAIL_ADDRESS_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

export function parseEmails(inputText: string): string[] {
  const foundEmails = inputText.match(EMAIL_ADDRESS_PATTERN) ?? [];
  return Array.from(new Set(foundEmails.map((email) => email.toLowerCase())));
}

function defaultStartTime(): string {
  const startTime = new Date(Date.now() + 60_000);
  startTime.setSeconds(0, 0);
  const padToTwoDigits = (value: number) => String(value).padStart(2, '0');
  const year = startTime.getFullYear();
  const month = padToTwoDigits(startTime.getMonth() + 1);
  const day = padToTwoDigits(startTime.getDate());
  const hour = padToTwoDigits(startTime.getHours());
  const minute = padToTwoDigits(startTime.getMinutes());

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

interface ComposeModalProps {
  open: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

export function ComposeModal({ open, onClose, onScheduled }: ComposeModalProps) {
  const { notify } = useToast();
  const [senders, setSenders] = useState<Sender[]>([]);
  const [senderId, setSenderId] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [leadsText, setLeadsText] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState(defaultStartTime());
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlySendLimit, setHourlySendLimit] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recipients = useMemo(() => parseEmails(leadsText), [leadsText]);

  const loadSenders = useCallback(async () => {
    try {
      const availableSenders = await api.senders();
      setSenders(availableSenders);
      setSenderId((previousSenderId) =>
        previousSenderId &&
        availableSenders.some((sender) => sender.id === previousSenderId)
          ? previousSenderId
          : availableSenders[0]?.id ?? '',
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Failed to load senders',
        'error',
      );
    }
  }, [notify]);

  useEffect(() => {
    if (!open) return;
    setScheduledStartTime(defaultStartTime());
    void loadSenders();
  }, [open, loadSenders]);

  const createSender = async () => {
    const senderName = window.prompt('New sender name', 'Sales');
    if (!senderName) return;
    try {
      const createdSender = await api.createSender({ name: senderName });
      await loadSenders();
      setSenderId(createdSender.id);
      notify(`Sender "${createdSender.name}" created`, 'success');
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Failed to create sender', 'error');
    }
  };

  const appendRecipientsFromFile = async (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    try {
      const fileContents = await selectedFile.text();
      setLeadsText((previousLeadsText) =>
        previousLeadsText
          ? `${previousLeadsText}\n${fileContents}`
          : fileContents,
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Failed to read recipient file',
        'error',
      );
    }
  };

  const scheduleEmails = async () => {
    if (!senderId) return notify('Pick a sender first', 'error');
    if (!subject.trim()) return notify('Subject is required', 'error');
    if (!messageBody.trim()) return notify('Body is required', 'error');
    if (recipients.length === 0) return notify('Add at least one recipient email', 'error');

    setIsSubmitting(true);
    try {
      const result = await api.schedule({
        senderId,
        subject,
        body: messageBody,
        recipients,
        startTime: new Date(scheduledStartTime).toISOString(),
        delaySeconds,
        hourlyLimit:
          hourlySendLimit === '' ? undefined : Number(hourlySendLimit),
      });
      notify(
        `Scheduled ${result.scheduled} email(s)` +
          (result.duplicatesSkipped ? `, ${result.duplicatesSkipped} duplicate(s) skipped` : ''),
        'success',
      );
      setSubject('');
      setMessageBody('');
      setLeadsText('');
      onScheduled();
      onClose();
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Failed to schedule emails', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Compose new email"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={scheduleEmails} loading={isSubmitting}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Sender">
          <div className="flex items-center gap-2">
            <select
              value={senderId}
              onChange={(event) => setSenderId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {senders.length === 0 && <option value="">No senders available</option>}
              {senders.map((sender) => (
                <option key={sender.id} value={sender.id}>
                  {sender.name} — {sender.email}
                </option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={createSender} type="button">
              New
            </Button>
          </div>
        </Field>

        <Field label="Subject">
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Quick intro"
          />
        </Field>

        <Field label="Body">
          <Textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="Hi {{name}}, ..."
          />
        </Field>

        <Field label="Leads (CSV / text)" hint={`${recipients.length} email address(es) detected`}>
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(event) => void appendRecipientsFromFile(event.target.files?.[0])}
            className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          <Textarea
            className="mt-2 min-h-[80px]"
            value={leadsText}
            onChange={(event) => setLeadsText(event.target.value)}
            placeholder="pasted emails, comma or newline separated…"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Start time">
            <Input
              type="datetime-local"
              value={scheduledStartTime}
              onChange={(event) => setScheduledStartTime(event.target.value)}
            />
          </Field>
          <Field label="Delay (sec)">
            <Input
              type="number"
              min={0}
              value={delaySeconds}
              onChange={(event) => setDelaySeconds(Number(event.target.value))}
            />
          </Field>
          <Field label="Hourly limit">
            <Input
              type="number"
              min={1}
              placeholder="default"
              value={hourlySendLimit}
              onChange={(event) =>
                setHourlySendLimit(
                  event.target.value === '' ? '' : Number(event.target.value),
                )
              }
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
