// Curated OpenMoji artwork, pinned source and license in public/pictograms/openmoji/README.md.
export const BUILTIN_PICTOGRAMS = [
  {
    "id": "tengo_hambre",
    "label": "Tengo Hambre",
    "code": "1F34E"
  },
  {
    "id": "tengo_sed",
    "label": "Tengo Sed",
    "code": "1F4A7"
  },
  {
    "id": "ir_al_banio",
    "label": "Ir al Baño",
    "code": "1F6BD"
  },
  {
    "id": "tengo_suenio",
    "label": "Tengo Sueño",
    "code": "1F634"
  },
  {
    "id": "un_abrazo",
    "label": "Un Abrazo",
    "code": "1FAC2"
  },
  {
    "id": "frio_calor",
    "label": "Frío o Calor",
    "code": "1F321"
  },
  {
    "id": "siento_feliz",
    "label": "Me siento Feliz",
    "code": "1F60A"
  },
  {
    "id": "siento_triste",
    "label": "Me siento Triste",
    "code": "1F622"
  },
  {
    "id": "siento_enojado",
    "label": "Me siento Enojado",
    "code": "1F620"
  },
  {
    "id": "siento_asustado",
    "label": "Me siento Asustado",
    "code": "1F630"
  },
  {
    "id": "siento_cansado",
    "label": "Me siento Cansado",
    "code": "1F971"
  },
  {
    "id": "siento_bien",
    "label": "Me siento Bien",
    "code": "1F44D"
  },
  {
    "id": "quiero_jugar",
    "label": "Quiero Jugar",
    "code": "1F9F8"
  },
  {
    "id": "quiero_salir",
    "label": "Quiero Salir",
    "code": "1F6AA"
  },
  {
    "id": "quiero_pintar",
    "label": "Quiero Pintar",
    "code": "1F3A8"
  },
  {
    "id": "favor_parar",
    "label": "Por favor, Parar",
    "code": "1F6D1"
  },
  {
    "id": "necesito_ayuda",
    "label": "Necesito Ayuda",
    "code": "1F64B"
  },
  {
    "id": "quiero_musica",
    "label": "Quiero Música",
    "code": "1F3B5"
  },
  {
    "id": "la_tablet",
    "label": "La Tablet",
    "code": "1F4F1"
  },
  {
    "id": "mi_juguete",
    "label": "Mi Juguete",
    "code": "1F3CE"
  },
  {
    "id": "un_libro",
    "label": "Un Libro",
    "code": "1F4D6"
  },
  {
    "id": "mi_cobija",
    "label": "Mi Cobija",
    "code": "1F6CC"
  },
  {
    "id": "mis_auriculares",
    "label": "Mis Auriculares",
    "code": "1F3A7"
  },
  {
    "id": "mis_colores",
    "label": "Mis Colores",
    "code": "270F"
  }
] as const;
const codes = new Set<string>(BUILTIN_PICTOGRAMS.map(item => item.code));
export function builtinSymbolCode(value: string): string | undefined {
  const match = /^np-symbol:([A-F0-9-]+)$/.exec(value);
  return match && codes.has(match[1]) ? match[1] : undefined;
}
export function defaultSymbol(id: string): string | undefined {
  const symbol = BUILTIN_PICTOGRAMS.find(item => item.id === id);
  return symbol ? 'np-symbol:' + symbol.code : undefined;
}
