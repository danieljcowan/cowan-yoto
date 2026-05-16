import { authedFetch, ApiError } from './client';
import type { Card } from '../types';

export async function listMyContent(): Promise<Card[]> {
  const candidates = ['/content/mine', '/card/mine', '/myo'];
  let lastErr: unknown = null;
  for (const path of candidates) {
    try {
      const res = await authedFetch(path);
      const data = await res.json();
      if (Array.isArray(data)) return data as Card[];
      if (Array.isArray(data?.cards)) return data.cards as Card[];
      if (Array.isArray(data?.content)) return data.content as Card[];
      if (Array.isArray(data?.items)) return data.items as Card[];
    } catch (e) {
      lastErr = e;
      if (e instanceof ApiError && e.status !== 404 && e.status !== 405) throw e;
    }
  }
  throw lastErr ?? new Error('No MYO list endpoint matched');
}

export async function getCard(id: string): Promise<Card> {
  const res = await authedFetch(`/content/${encodeURIComponent(id)}`);
  const data = await res.json();
  if (data?.card) return data.card as Card;
  if (data?.content && (data.content.id || data.content.cardId)) return data.content as Card;
  return data as Card;
}

export async function saveCard(card: Card): Promise<Card> {
  const res = await authedFetch('/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
  const data = await res.json();
  return (data?.card ?? data) as Card;
}
