-- Run in Supabase SQL Editor.
-- Tracks which prayer notifications were sent on which date so we don't send twice.
-- Used by the cron job (server-side with service role).

create table if not exists public.prayer_notification_sent (
  id bigint primary key default (extract(epoch from now()) * 1000)::bigint,
  date text not null,
  prayer_key text not null,
  created_at timestamptz not null default now(),
  unique(date, prayer_key)
);

alter table public.prayer_notification_sent enable row level security;

-- Only backend (service role) needs access; no policies for anon/authenticated so they can't read/write.
-- Service role bypasses RLS.

create index if not exists prayer_notification_sent_date_idx on public.prayer_notification_sent(date);
