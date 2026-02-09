-- Run in Supabase SQL Editor. Adds categories and links habits to categories.

-- Categories table (per user)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users can view own categories"
  on public.categories for select using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete using (auth.uid() = user_id);

create index if not exists categories_user_id_idx on public.categories(user_id);

-- Add category_id to habits (optional FK)
alter table public.habits
add column if not exists category_id uuid references public.categories(id) on delete set null;

create index if not exists habits_category_id_idx on public.habits(category_id);
