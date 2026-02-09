-- Run in Supabase SQL Editor.
-- Tracks which users received the daily summary so we send at most once per day per user.

create table if not exists public.daily_summary_sent (
  id bigint primary key default (extract(epoch from now()) * 1000)::bigint,
  date text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(date, user_id)
);

alter table public.daily_summary_sent enable row level security;

-- Only backend (service role) needs access.
create index if not exists daily_summary_sent_date_idx on public.daily_summary_sent(date);
