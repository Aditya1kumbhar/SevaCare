-- ==============================================================================
-- Security Hardening & Linter Fixes for Supabase
-- ==============================================================================

-- 1. Fix mutable search_path on match_knowledge function
create or replace function public.match_knowledge(
  query_embedding extensions.vector(768),
  match_count int default 3
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
set search_path = public, extensions
as $$
begin
  return query
  select
    kc.id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  order by kc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 2. Remove permissive public INSERT policy (seeding is complete; prevent unauthorized writes)
drop policy if exists "Anyone can insert knowledge_chunks" on public.knowledge_chunks;

-- Ensure public READ access remains active
drop policy if exists "Anyone can read knowledge_chunks" on public.knowledge_chunks;
create policy "Anyone can read knowledge_chunks"
  on public.knowledge_chunks for select
  using (true);

-- 3. Lock down rls_auto_enable SECURITY DEFINER function from anon / public roles
do $$
begin
  if exists (
    select 1 from pg_proc 
    where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace
  ) then
    revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
  end if;
end $$;
