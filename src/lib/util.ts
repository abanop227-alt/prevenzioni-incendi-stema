export function nuovoId(prefisso = ''): string {
  const c = globalThis.crypto;
  const r = c?.randomUUID ? c.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return prefisso + r;
}

export function oggiISO(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** yyyy-mm-dd -> dd/mm/yyyy */
export function dataItaliana(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso || '';
}

/** "CONDOMINIO CARAVAGGIO" → "CARAVAGGIO": il nome come nell'Excel, senza la parola "Condominio" che i titoli aggiungono da soli. */
export const nomeSenzaCondominio = (nome: string) => nome.replace(/^\s*(condominio|cond\.?)\s+/i, '').trim();
