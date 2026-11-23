import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export { describe, it };

interface Expectation<T = any> {
  toBe(expected: any): void;
  toEqual(expected: any): void;
  toMatch(expected: RegExp | string): void;
  toContain(expected: any): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toThrow(expected?: any): void;
  not: Expectation<T>;
}

export function expect<T = any>(actual: T): Expectation<T> {
  const makeExpectation = (isNot: boolean): Expectation<T> => ({
    toBe(expected: any) {
      if (isNot) {
        assert.notStrictEqual(actual, expected);
      } else {
        assert.strictEqual(actual, expected);
      }
    },
    toEqual(expected: any) {
      if (isNot) {
        assert.notDeepStrictEqual(actual, expected);
      } else {
        assert.deepStrictEqual(actual, expected);
      }
    },
    toMatch(expected: RegExp | string) {
      if (isNot) {
        assert.doesNotMatch(String(actual), expected as RegExp);
      } else {
        assert.match(String(actual), expected as RegExp);
      }
    },
    toContain(expected: any) {
      if (Array.isArray(actual) || typeof actual === 'string') {
        const contains = (actual as any).includes(expected);
        if (isNot) {
          assert.ok(!contains, `Expected ${JSON.stringify(actual)} not to contain ${JSON.stringify(expected)}`);
        } else {
          assert.ok(contains, `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
        }
      } else {
        throw new Error(`toContain called on non-collection: ${typeof actual}`);
      }
    },
    toBeNull() {
      if (isNot) {
        assert.notStrictEqual(actual, null);
      } else {
        assert.strictEqual(actual, null);
      }
    },
    toBeUndefined() {
      if (isNot) {
        assert.notStrictEqual(actual, undefined);
      } else {
        assert.strictEqual(actual, undefined);
      }
    },
    toBeDefined() {
      if (isNot) {
        assert.strictEqual(actual, undefined);
      } else {
        assert.notStrictEqual(actual, undefined);
      }
    },
    toBeTruthy() {
      if (isNot) {
        assert.ok(!actual);
      } else {
        assert.ok(!!actual);
      }
    },
    toBeFalsy() {
      if (isNot) {
        assert.ok(!!actual);
      } else {
        assert.ok(!actual);
      }
    },
    toBeGreaterThan(expected: number) {
      if (isNot) {
        assert.ok((actual as any) <= expected);
      } else {
        assert.ok((actual as any) > expected);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (isNot) {
        assert.ok((actual as any) < expected);
      } else {
        assert.ok((actual as any) >= expected);
      }
    },
    toBeLessThan(expected: number) {
      if (isNot) {
        assert.ok((actual as any) >= expected);
      } else {
        assert.ok((actual as any) < expected);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (isNot) {
        assert.ok((actual as any) > expected);
      } else {
        assert.ok((actual as any) <= expected);
      }
    },
    toThrow(expected?: any) {
      if (typeof actual !== 'function') {
        throw new Error('toThrow called on non-function');
      }
      if (isNot) {
        assert.doesNotThrow(actual as () => any);
      } else {
        assert.throws(actual as () => any, expected);
      }
    },
    get not() {
      return makeExpectation(!isNot);
    },
  });

  return makeExpectation(false);
}
