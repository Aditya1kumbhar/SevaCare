import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pdzwxijuktpmcvnodnzn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkend4aWp1a3RwbWN2bm9kbnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODU1ODcsImV4cCI6MjEwMDU2MTU4N30.o0xgeFSLXc74dAruCTR_I9dr8mBdQ_8sI21qX1yqMzY';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

/**
 * Embed text using Gemini embedding model.
 * Max 1.5s timeout with fallback to zero vector.
 */
export async function embedText(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    return new Array(768).fill(0);
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { parts: [{ text }] },
        }),
        signal: controller.signal
      }
    );
    clearTimeout(timer);

    if (!res.ok) {
      return new Array(768).fill(0);
    }

    const data = await res.json();
    return data.embedding?.values || new Array(768).fill(0);
  } catch (e: any) {
    return new Array(768).fill(0);
  }
}

/**
 * Retrieve the top-K most relevant knowledge chunks for a query.
 * Uses Supabase pgvector cosine similarity via the match_knowledge RPC.
 */
export async function retrieveContext(query: string, topK: number = 3): Promise<string> {
  try {
    const queryEmbedding = await embedText(query);

    // If embedding is all zeros (API unavailable/timed out), skip RAG immediately
    if (queryEmbedding.every(v => v === 0)) {
      return '';
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_count: topK,
    });

    if (error || !data || data.length === 0) {
      return '';
    }

    return data
      .map((chunk: { content: string; similarity: number }) => chunk.content)
      .join('\n\n');
  } catch (e: any) {
    return '';
  }
}
