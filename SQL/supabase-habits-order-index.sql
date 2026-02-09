-- Run in Supabase SQL Editor. Adds order_index for drag-and-drop habit ordering.

alter table public.habits
add column if not exists order_index integer not null default 0;

-- Backfill: set order_index by created_at (oldest = 0, then 1, 2, ...) per user
with ordered as (
  select id, row_number() over (partition by user_id order by created_at asc) - 1 as rn
  from public.habits
)
update public.habits h
set order_index = ordered.rn
from ordered
where h.id = ordered.id;

create index if not exists habits_user_order_idx on public.habits(user_id, order_index);
