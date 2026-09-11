import "fake-indexeddb/auto";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.DATABASE_URL ??= "postgres://postgres:postgres@127.0.0.1:51214/template1?sslmode=disable";

afterEach(() => {
  cleanup();
});
