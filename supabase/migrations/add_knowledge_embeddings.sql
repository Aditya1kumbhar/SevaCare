-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Knowledge chunks table for RAG
create table if not exists public.knowledge_chunks (
  id bigserial primary key,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding extensions.vector(768),
  created_at timestamptz default now()
);

-- Index for fast cosine similarity search
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 10);

-- RPC function: match knowledge chunks by cosine similarity
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

-- Allow anon/authenticated to read and write knowledge chunks
alter table public.knowledge_chunks enable row level security;
create policy "Anyone can read knowledge_chunks"
  on public.knowledge_chunks for select
  using (true);

create policy "Anyone can insert knowledge_chunks"
  on public.knowledge_chunks for insert
  with check (true);

