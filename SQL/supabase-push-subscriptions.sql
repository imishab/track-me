-- Run in Supabase SQL Editor.
-- Stores PushAlert subscriber_id per user for personalized daily summary notifications.

create table if not exists public.push_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  subscriber_id text not null,
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Users can insert/update only their own row (when they subscribe on this device).
create policy "Users can upsert own push subscription"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists push_subscriptions_subscriber_id_idx on public.push_subscriptions(subscriber_id);
