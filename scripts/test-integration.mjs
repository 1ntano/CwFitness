import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const root = new URL('../', import.meta.url);
const testServerName = `cwfitness-test-${process.pid}`;
const testServerPort = process.env.TEST_SERVER_PORT ?? '51313';
const testDatabasePort = process.env.TEST_DATABASE_PORT ?? '51314';
const testShadowDatabasePort = process.env.TEST_SHADOW_DB_PORT ?? '51315';
const testAppPort = process.env.TEST_APP_PORT ?? '3101';
const databaseUrl = `postgres://postgres:postgres@127.0.0.1:${testDatabasePort}/template1?sslmode=disable`;
const baseUrl = `http://127.0.0.1:${testAppPort}`;
const localEmailOutbox = join(tmpdir(), 'cwfitness-local-email-outbox.jsonl');
const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  BETTER_AUTH_SECRET: 'cwfitness-integration-test-secret-not-for-production',
  BETTER_AUTH_URL: baseUrl,
  TEST_BASE_URL: baseUrl,
  PLAYWRIGHT_CHANNEL: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
  NEXT_DIST_DIR: '.next-test',
  LOCAL_EMAIL_OUTBOX: localEmailOutbox,
  PASSWORD_RESET_EXPIRES_IN_SECONDS: '2',
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: 'inherit',
      ...options,
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

async function startPrismaDev() {
  return new Promise((resolve, reject) => {
    const child = spawn(node, [prismaCli, 'dev', '--name', testServerName, '--port', testServerPort, '--db-port', testDatabasePort, '--shadow-db-port', testShadowDatabasePort, '--detach'], {
      cwd: root,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const handleOutput = (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
      const match = output.match(/postgres:\/\/[^\s]+/);
      if (match) env.DATABASE_URL = match[0];
    };
    child.stdout.on('data', handleOutput);
    child.stderr.on('data', handleOutput);
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0 && env.DATABASE_URL.startsWith('postgres://')) resolve();
      else reject(new Error(`Prisma dev exited without a database URL (code ${code})`));
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/plans`);
      if (response.status === 401) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Next.js test server did not become ready within 30 seconds');
}

const node = process.execPath;
const prismaCli = new URL('../node_modules/prisma/build/index.js', import.meta.url).pathname.slice(1);
const nextCli = new URL('../node_modules/next/dist/bin/next', import.meta.url).pathname.slice(1);
const playwrightCli = new URL('../node_modules/@playwright/test/cli.js', import.meta.url).pathname.slice(1);

let databaseStarted = false;
let server;

try {
  await rm(join(process.cwd(), '.next-test'), { recursive: true, force: true });
  await rm(localEmailOutbox, { force: true });
  await startPrismaDev();
  databaseStarted = true;
  await run(node, [prismaCli, 'migrate', 'deploy']);

  server = spawn(node, [nextCli, 'dev', '-H', '127.0.0.1', '-p', testAppPort], {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  await waitForServer();
  await run(node, ['--test', 'tests/plans-api.test.mjs']);
  await run(node, [playwrightCli, 'test']);
} finally {
  if (server) await stopServer(server);
  if (databaseStarted) await run(node, [prismaCli, 'dev', 'stop', testServerName]);
}
