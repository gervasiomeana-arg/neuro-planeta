import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createLearningQuestion, LEARNING_GAMES, type LearningLevel } from '../src/learning/curriculum';
import { GAME_ARTWORK } from '../src/learning/gameArtwork';
import { GameText } from '../src/learning/GameText';

const emoji = /\p{Extended_Pictographic}\uFE0F?/gu;
test('all 345 new-game questions and original matching images have bundled artwork', () => {
  const texts = LEARNING_GAMES.map(g => g.icon);
  let questions = 0;
  for (const game of LEARNING_GAMES.filter(g => !['numbers', 'matching'].includes(g.id))) {
    for (const level of [1, 2, 3] as LearningLevel[]) for (let round = 0; round < 5; round++) {
      const q = createLearningQuestion(game.id, level, round);
      texts.push(q.prompt, q.visual || '', q.hint, q.explanation, ...(q.memory || []), ...(q.sequence || []), ...(q.grid || []), ...q.options.flatMap(o => [o.text, o.visual || '']));
      assert.ok(q.memory || q.sequence || q.options.some(o => o.id === q.answer));
      questions++;
    }
  }
  texts.push('🐶 🐱 🐰 🍌 🍎 🍐 ☀️ 🌙 ⭐ 🚲 🚌 🚗');
  assert.equal(questions, 345);
  for (const text of texts) for (const [symbol] of text.matchAll(emoji)) {
    assert.ok(GAME_ARTWORK[symbol], `Missing artwork: ${symbol}`);
  }
  for (const { code, label, collection } of Object.values(GAME_ARTWORK)) {
    const svg = readFileSync(new URL(`../public/pictograms/${collection || 'openmoji'}/${code}.svg`, import.meta.url), 'utf8');
    assert.ok(label);
    assert.match(svg, /<svg[\s>]/);
    assert.match(svg, /viewBox="0 0 72 72"/);
    assert.doesNotMatch(svg, /<script|<foreignObject|https?:\/\/[^"\s]+\.(?:png|svg|jpg)/i);
  }
});
test('game text renders repeated local images and preserves numbers, ordering and line breaks', () => {
  const html = renderToStaticMarkup(createElement(GameText, { text: 'A: 🍎 🍎\nB: 🍎\n🪮 1 → 2' }));
  assert.equal((html.match(/<img /g) || []).length, 4);
  assert.equal((html.match(/role="img"/g) || []).length, 4);
  assert.match(html, /aria-label="peine"/);
  assert.match(html, /\/pictograms\/openmoji\/1FAAE.svg/);
  assert.match(html, /1 → 2/);
  assert.ok(html.includes('\nB:'));
  assert.doesNotMatch(html, /🍎|🪮/u);
});

test('drying hands shows a towel rather than the laundry basket', () => {
  const q = createLearningQuestion('hygiene', 1, 2);
  assert.equal(q.answer, 'toalla');
  assert.equal(q.visual, '[[toalla]]');
  const html = renderToStaticMarkup(createElement(GameText, { text: q.visual! }));
  assert.match(html, /aria-label="toalla"/);
  assert.match(html, /pictograms\/neuroplaneta\/towel.svg/);
  assert.doesNotMatch(html, /1F9FA|\[\[toalla\]\]/);
});
