import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

for (const variant of ['Immersive', 'Spotlight', 'Split']) {
  assert.match(html, new RegExp(`>${variant}<`), `picker is missing ${variant}`);
}

for (const requirement of ['type="email"', 'type="password"', 'autocomplete="email"', 'autocomplete="current-password"', 'aria-live="polite"', 'data-message']) {
  assert.ok(html.includes(requirement), `missing login requirement: ${requirement}`);
}

assert.ok(html.includes('class="proto-picker"'), 'missing prototype picker');
assert.match(html, /url\.searchParams\.set\('v',i\+1\)/, 'variant selection must persist in URL');
assert.match(html, /e\.key==='ArrowRight'/, 'picker must support arrow keys');
assert.match(html, /e\.key==='r'\|\|e\.key==='R'/, 'picker must support replay');
assert.ok(html.includes('prefers-reduced-motion:reduce'), 'missing reduced-motion handling');
assert.ok(html.includes('prefers-reduced-transparency:reduce'), 'missing reduced-transparency handling');
assert.ok(html.includes('prefers-contrast:more'), 'missing high-contrast handling');
assert.ok(!html.includes('transition:all'), 'transition: all must not ship');
assert.ok(!html.includes('scale(0)'), 'scale(0) entrance must not ship');
assert.ok(!html.includes('ease-in'), 'ease-in UI animation must not ship');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length, 'prototype must include behavior script');
assert.doesNotThrow(() => new Function(scripts.at(-1)[1]), 'inline behavior script must parse');

console.log('Login variants, form semantics, picker behavior, script syntax, and motion guardrails passed.');
