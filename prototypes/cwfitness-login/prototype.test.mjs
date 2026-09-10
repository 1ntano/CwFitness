import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

assert.ok(html.includes('class="login split"'), 'selected Split login must render');
for (const removed of ['login immersive', 'login spotlight', 'class="proto-picker"', 'const variants=', 'function setActive']) {
  assert.ok(!html.includes(removed), `unselected prototype surface remains: ${removed}`);
}

for (const requirement of ['type="email"', 'type="password"', 'autocomplete="email"', 'autocomplete="current-password"', 'aria-live="polite"', 'data-message']) {
  assert.ok(html.includes(requirement), `missing login requirement: ${requirement}`);
}

assert.ok(html.includes('prefers-reduced-motion:reduce'), 'missing reduced-motion handling');
assert.ok(html.includes('prefers-reduced-transparency:reduce'), 'missing reduced-transparency handling');
assert.ok(html.includes('prefers-contrast:more'), 'missing high-contrast handling');
assert.ok(!html.includes('transition:all'), 'transition: all must not ship');
assert.ok(!html.includes('scale(0)'), 'scale(0) entrance must not ship');
assert.ok(!html.includes('ease-in'), 'ease-in UI animation must not ship');
assert.match(html, /\.reveal\{[^}]*top:50%;[^}]*align-items:center;[^}]*transform:translateY\(-50%\)/, 'password reveal control must be vertically centered');
assert.match(html, /\.split \.form-side\{[^}]*background:transparent/, 'split form side must allow the image transition through');
assert.match(html, /--veil:linear-gradient\(90deg,[^;]*38%[^;]*62%[^;]*82%/, 'split backdrop must use a gradual multi-stop transition');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length, 'prototype must include behavior script');
assert.doesNotThrow(() => new Function(scripts.at(-1)[1]), 'inline behavior script must parse');

console.log('Promoted Split login, form semantics, script syntax, and motion guardrails passed.');