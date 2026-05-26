-- ──────────────────────────────────────────────────────────────────
-- FAITH — Supabase schema for user profiles + future paywall
-- Run this in Supabase → SQL Editor after creating your project.
-- ──────────────────────────────────────────────────────────────────

-- One row per user, keyed on auth.users.id
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  business_name text,
  business_contact text,
  business_address text,
  po_template text,
  -- For future paywall:
  subscribed boolean default false,
  subscription_plan text,        -- e.g. 'free' | 'pro' | 'business'
  trial_ends_at timestamptz default (now() + interval '14 days'),
  -- Stored as JSON so each customer has their own sheet connection
  sheet_connection jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity log per user (orders sent, stock movements)
create table if not exists activities (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  type text not null,            -- 'in' | 'out' | 'use' | 'adjust' | 'order'
  item_id text,
  item_name text,
  qty numeric,
  vendor text,
  note text,
  created_at timestamptz default now()
);

-- Locally-added products (when customer adds rows outside their sheet)
create table if not exists local_products (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  sku text,
  category text,
  stock numeric,
  safety numeric,
  vendor text,
  vendor_email text,
  unit_cost numeric,
  reorder_qty numeric,
  extra jsonb,
  created_at timestamptz default now()
);

-- ─── Row Level Security: each user only sees their own data ───
alter table profiles      enable row level security;
alter table activities    enable row level security;
alter table local_products enable row level security;

create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can read own activities" on activities for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on activities for insert with check (auth.uid() = user_id);
create policy "Users can delete own activities" on activities for delete using (auth.uid() = user_id);

create policy "Users can read own products" on local_products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on local_products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on local_products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on local_products for delete using (auth.uid() = user_id);

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
