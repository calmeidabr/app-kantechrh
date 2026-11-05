// Gerenciador central de invalidação de cache para o Diagnóstico Ampliado
let lastInvalidationTime = 0;

export function invalidateDiagnosticoCache() {
  lastInvalidationTime = Date.now();
}

export function getLastCacheInvalidationTime(): number {
  return lastInvalidationTime;
}
