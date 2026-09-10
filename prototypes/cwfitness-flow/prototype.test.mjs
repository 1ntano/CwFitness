import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

assert.match(html, /id="variant-cinematic"/, 'missing the promoted Cinematic prototype');
assert.ok(!html.includes('id="variant-console"'), 'unselected Glass Console prototype must be removed');
assert.ok(!html.includes('id="variant-focus"'), 'unselected Focus Rail prototype must be removed');
assert.ok(!html.includes('class="proto-picker"'), 'variant picker must be removed after selection');

assert.ok(html.includes('class="cinematic-nav glass"'), 'missing glass main navigation');
assert.match(html, /\.cinematic \.cinematic-nav \{[^}]*top: 20px;[^}]*left: 50%;[^}]*translateX\(-50%\)/, 'main navigation must be centered at the top');
for (const destination of ['home', 'plans', 'progress']) {
  assert.ok(html.includes(`data-nav="${destination}"`), `missing ${destination} navigation`);
}

for (const interaction of ['data-start', 'data-set', 'data-pause', 'data-finish', 'data-settings', 'data-nav="progress"']) {
  assert.ok(html.includes(interaction), `missing interaction: ${interaction}`);
}

assert.ok(html.includes('prefers-reduced-motion: reduce'), 'missing reduced-motion handling');
assert.ok(html.includes('(hover: hover) and (pointer: fine)'), 'missing precise-pointer hover gate');
assert.ok(!html.includes('transition: all'), 'transition: all must not ship');
assert.ok(!html.includes('scale(0)'), 'scale(0) entrance must not ship');
assert.ok(!html.includes('ease-in;'), 'ease-in UI animation must not ship');
assert.ok(!html.includes('templateIds'), 'variant-switching state must be removed');
assert.ok(!html.includes('function setActive'), 'variant-switching behavior must be removed');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length > 0, 'prototype must include behavior script');
assert.doesNotThrow(() => new Function(scripts.at(-1)[1]), 'inline behavior script must parse');

console.log('Selected prototype navigation, interactions, script syntax, and motion guardrails passed.');