create table if not exists public.opportunities (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references auth.users (id) on delete cascade,
    author_name text not null,
    type text not null check (type in ('Paid Job', 'Volunteer')),
    location text not null,
    title text not null,
    description text not null,
    responsibilities text not null default '',
    schedule text not null default '',
    contact text not null default '',
    whatsapp text,
    instagram text,
    email text,
    phone text,
    pay text not null default '',
    created_at timestamptz not null default now()
);

alter table public.opportunities
    add column if not exists whatsapp text,
    add column if not exists instagram text,
    add column if not exists email text,
    add column if not exists phone text;

alter table public.opportunities enable row level security;

drop policy if exists "Anyone can view opportunities" on public.opportunities;
create policy "Anyone can view opportunities"
    on public.opportunities for select
    using (true);

drop policy if exists "Signed-in users can post opportunities" on public.opportunities;
create policy "Signed-in users can post opportunities"
    on public.opportunities for insert
    to authenticated
    with check (auth.uid() = author_id);

drop policy if exists "Authors can update their opportunities" on public.opportunities;
create policy "Authors can update their opportunities"
    on public.opportunities for update
    to authenticated
    using (auth.uid() = author_id)
    with check (auth.uid() = author_id);

drop policy if exists "Authors can delete their opportunities" on public.opportunities;
create policy "Authors can delete their opportunities"
    on public.opportunities for delete
    to authenticated
    using (auth.uid() = author_id);
