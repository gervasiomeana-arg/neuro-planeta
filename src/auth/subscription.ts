export function monthlyPriceCents(value: string) {
  const match = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error('Ingresá pesos sin separador de miles y hasta dos decimales.');
  return Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
}
