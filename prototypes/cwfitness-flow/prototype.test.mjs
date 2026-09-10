import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

for (const variant of ['Cinematic', 'Glass Console', 'Focus Rail']) {
  assert.match(html, new RegExp(`>${variant}<`), `picker is missing ${variant}`);
}

for (const template of ['variant-cinematic', 'variant-console', 'variant-focus']) {
  assert.match(html, new RegExp(`id="${template}"`), `missing ${template}`);
}

for (const interaction of ['data-start', 'data-set', 'data-pause', 'data-finish', 'data-settings', 'data-nav="progress"']) {
  assert.ok(html.includes(interaction), `missing interaction: ${interaction}`);
}

assert.ok(html.includes('prefers-reduced-motion: reduce'), 'missing reduced-motion handling');
assert.ok(html.includes('(hover: hover) and (pointer: fine)'), 'missing precise-pointer hover gate');
assert.ok(!html.includes('transition: all'), 'transition: all must not ship');
assert.ok(!html.includes('scale(0)'), 'scale(0) entrance must not ship');
assert.ok(!html.includes('ease-in;'), 'ease-in UI animation must not ship');
assert.match(html, /url\.searchParams\.set\('v', i \+ 1\)/, 'variant choice must persist in URL');
assert.match(html, /e\.key === 'ArrowRight'/, 'picker must support arrow keys');
assert.match(html, /e\.key === 'r' \|\| e\.key === 'R'/, 'picker must support replay');
assert.ok(html.includes('class="proto-picker" data-position="top"'), 'picker must avoid bottom navigation');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length > 0, 'prototype must include behavior script');
assert.doesNotThrow(() => new Function(scripts.at(-1)[1]), 'inline behavior script must parse');

console.log('Prototype structure, script syntax, and motion guardrails passed.');
