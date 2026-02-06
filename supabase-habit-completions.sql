-- Run in Supabase SQL Editor. Stores daily completion data per habit for analytics.

create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date text not null,
  value integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(habit_id, date)
);

alter table public.habit_completions enable row level security;

create policy "Users can view own completions"
  on public.habit_completions for select
  using (auth.uid() = user_id);

create policy "Users can insert own completions"
  on public.habit_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own completions"
  on public.habit_completions for update
  using (auth.uid() = user_id);

create policy "Users can delete own completions"
  on public.habit_completions for delete
  using (auth.uid() = user_id);

create index if not exists habit_completions_user_date_idx on public.habit_completions(user_id, date);
create index if not exists habit_completions_habit_date_idx on public.habit_completions(habit_id, date);
