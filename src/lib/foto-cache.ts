// In-memory cache for talent photos
export const fotoCache = new Map<string, string | null>();

export function setFotoCache(id: string | number, b64: string | null, nome?: string) {
  fotoCache.set(String(id), b64);
  if (nome) {
    fotoCache.set(`nome:${nome.toLowerCase()}`, b64);
  }
}

export function invalidateFotoCache(id?: string | number, nome?: string) {
  if (id) fotoCache.delete(String(id));
  if (nome) fotoCache.delete(`nome:${nome.toLowerCase()}`);
  if (!id && !nome) fotoCache.clear();
}
