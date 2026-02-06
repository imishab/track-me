-- Run this in your Supabase project: SQL Editor → New query → paste and run.

-- Habits table (per user)
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  tracking_type text not null check (tracking_type in ('checkbox', 'numeric', 'duration')),
  target_value numeric null,
  unit text null,
  created_at timestamptz not null default now()
);

-- Row Level Security: users can only see and manage their own habits
alter table public.habits enable row level security;

create policy "Users can view own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- Optional: index for listing habits by user
create index if not exists habits_user_id_idx on public.habits(user_id);
