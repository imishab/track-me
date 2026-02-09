-- Run in Supabase SQL Editor if you already have habits table.
-- Adds archived column for soft-hide (habits still in DB, hidden from Today).

alter table public.habits
add column if not exists archived boolean not null default false;

create index if not exists habits_user_archived_idx on public.habits(user_id, archived);
