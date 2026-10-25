import { Fragment, useState } from 'react';
import { GAME_ARTWORK } from './gameArtwork';

// Longer tokens first so the presentation selector stays attached to its symbol.
const symbols = Object.keys(GAME_ARTWORK).sort((a, b) => b.length - a.length);
const pattern = new RegExp(`(${symbols.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'u');

function GameSymbol({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false);
  const artwork = GAME_ARTWORK[symbol];
  return <span className="np-game-symbol" role="img" aria-label={artwork.label} data-failed={failed || undefined}>
    {failed ? artwork.label : <img src={`${(import.meta.env?.BASE_URL || '/')}pictograms/openmoji/${artwork.code}.svg`} alt="" draggable={false} onError={() => setFailed(true)} />}
  </span>;
}

/** Local artwork replaces device-dependent emoji without changing question IDs. */
export function GameText({ text }: { text: string }) {
  return <>{text.split(pattern).map((part, index) => GAME_ARTWORK[part]
    ? <GameSymbol key={`${index}-${part}`} symbol={part} />
    : <Fragment key={index}>{part}</Fragment>)}</>;
}

export function GameArtworkCredit() {
  return <p className="np-learning-small">Ilustraciones de <a href="https://openmoji.org/" target="_blank" rel="noopener noreferrer">OpenMoji</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. <a href={`${(import.meta.env?.BASE_URL || '/')}pictograms/openmoji/README.md`} target="_blank" rel="noopener noreferrer">Créditos y origen</a></p>;
}
