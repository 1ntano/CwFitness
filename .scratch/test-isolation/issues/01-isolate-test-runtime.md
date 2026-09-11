# 01: Isolate integration test runtime

**What to build:** The complete local test command can run without stopping the development server.

**Blocked by:** None

**Status:** resolved

- [x] Give the test Next.js server its own port.
- [x] Give the test Prisma server a unique name.
- [x] Parse the Prisma URL emitted by `prisma dev` and use it for migrations.
- [x] Use a separate Next.js `distDir`.
- [x] Update exercise test payloads and expectations for current required fields.
- [x] Run `npm.cmd test` successfully with the development server active.

## Answer

The integration runner now uses the isolated Next.js port `3101` by default, unique Prisma server names, a separate `.next-test` output directory, and the actual database URL emitted by the Prisma CLI. The complete suite passes with 7 unit tests, 22 integration tests, and 1 browser test.
