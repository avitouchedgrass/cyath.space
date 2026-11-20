begin;

create table public.review_canvases (
  share_id text primary key check (share_id ~ '^[A-Za-z0-9_-]{8,64}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id text,
  project jsonb not null check (jsonb_typeof(project) = 'object'),
  revision integer not null default 1 check (revision > 0),
  approval_digest text,
  approval_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_id, request_id)
);

create index review_canvases_owner on public.review_canvases (owner_id, created_at desc);

create table public.review_entitlements (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  active_until timestamptz not null
);

create table public.review_mcp_keys (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  token_digest text unique not null
);

alter table public.review_canvases enable row level security;
alter table public.review_entitlements enable row level security;
alter table public.review_mcp_keys enable row level security;

revoke all on public.review_canvases, public.review_entitlements, public.review_mcp_keys from anon, authenticated, public;
grant select, insert, update, delete on public.review_canvases, public.review_entitlements, public.review_mcp_keys to service_role;

create function public.create_review_canvas(
  p_share_id text,
  p_owner_id uuid,
  p_request_id text,
  p_project jsonb
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  canvas public.review_canvases;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner_id::text, 0));

  if p_request_id is not null then
    select * into canvas from public.review_canvases
      where owner_id = p_owner_id and request_id = p_request_id;
    if found then return pg_catalog.to_jsonb(canvas); end if;
  end if;

  if not exists (
    select 1 from public.review_entitlements
      where owner_id = p_owner_id and active_until > pg_catalog.now()
  ) and exists (
    select 1 from public.review_canvases where owner_id = p_owner_id
  ) then
    raise exception using errcode = 'P0001', message = 'review quota reached';
  end if;

  insert into public.review_canvases (share_id, owner_id, request_id, project)
    values (p_share_id, p_owner_id, p_request_id, p_project)
    returning * into canvas;
  return pg_catalog.to_jsonb(canvas);
end;
$$;

revoke all on function public.create_review_canvas(text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.create_review_canvas(text, uuid, text, jsonb) to service_role;

-- Preserve legacy rows for an ownership-verified migration while closing the
-- old unauthenticated access paths immediately.
do $$
begin
  if to_regclass('public.projects') is not null then
    execute 'drop policy if exists "Owners manage own projects" on public.projects';
    execute 'drop policy if exists "Public can view projects" on public.projects';
  end if;
  if to_regclass('public.pins') is not null then
    execute 'drop policy if exists "Public can read and create pins" on public.pins';
  end if;
  if to_regclass('public.comments') is not null then
    execute 'drop policy if exists "Public can read and create comments" on public.comments';
  end if;
end;
$$;

commit;
