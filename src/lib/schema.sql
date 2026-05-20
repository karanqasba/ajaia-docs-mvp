create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 80),
  content text not null default '<p></p>',
  owner_id text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  owner_id text not null,
  shared_with_user_id text not null,
  created_at timestamptz default now(),
  unique(document_id, shared_with_user_id)
);

alter table documents enable row level security;
alter table document_shares enable row level security;

-- For this timeboxed assignment, users are mocked in the app rather than authenticated.
-- Reviewers should keep the Supabase anon key restricted to this demo project.
create policy "demo documents read" on documents for select using (true);
create policy "demo documents write" on documents for all using (true) with check (true);
create policy "demo shares read" on document_shares for select using (true);
create policy "demo shares write" on document_shares for all using (true) with check (true);
