import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

/**
 * Embed text using Gemini text-embedding-004 (free tier, 768 dims).
 * Falls back to a zero vector if the API is unavailable so the app never crashes.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    console.warn('[RAG] No GEMINI_API_KEY — returning zero vector');
    return new Array(768).fill(0);
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!res.ok) {
      console.warn('[RAG] Embedding API error', res.status);
      return new Array(768).fill(0);
    }

    const data = await res.json();
    return data.embedding?.values || new Array(768).fill(0);
  } catch (e: any) {
    console.warn('[RAG] Embedding fetch failed:', e.message);
    return new Array(768).fill(0);
  }
}

/**
 * Retrieve the top-K most relevant knowledge chunks for a query.
 * Uses Supabase pgvector cosine similarity via the match_knowledge RPC.
 */
export async function retrieveContext(query: string, topK: number = 3): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const queryEmbedding = await embedText(query);

    // If embedding is all zeros (API unavailable), skip RAG
    if (queryEmbedding.every(v => v === 0)) {
      return '';
    }

    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_count: topK,
    });

    if (error || !data || data.length === 0) {
      return '';
    }

    // Join the top chunks into a single context string
    return data
      .map((chunk: { content: string; similarity: number }) => chunk.content)
      .join('\n\n');
  } catch (e: any) {
    console.warn('[RAG] Retrieval failed:', e.message);
    return '';
  }
}
