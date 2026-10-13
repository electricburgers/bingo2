/* Shared test harness: loads the real browser scripts (in index.html order, minus main.js)
   into a vm sandbox with a tiny DOM stub. */
import vm from 'node:vm';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const read = p => readFileSync(join(root, p), 'utf8');
export const html = read('index.html');
export const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

export function loadApp(storage = {}) {
  const noop = () => {};
  const sandbox = {
    console, Intl, Math, Date, JSON, Set, Map, Array, Object, Number, String, Promise, Error,
    localStorage: { getItem: k => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
                addEventListener: noop, visibilityState: 'visible', documentElement: { style: { setProperty: noop } } },
    addEventListener: noop, navigator: {}, setTimeout, clearTimeout,
  };
  sandbox.self = sandbox; sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  for (const s of scripts.filter(s => s !== 'js/main.js')) vm.runInContext(read(s), ctx, { filename: s });
  return { run: code => vm.runInContext(code, ctx), ctx };
}

