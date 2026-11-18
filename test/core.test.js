import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode } from '../src/index.js';

/**
 * Helper: build a Uint8Array from an array of numbers.
 * @param {number[]} bytes
 * @returns {Uint8Array}
 */
function bytes(...values) {
  return new Uint8Array(values);
}

test('encode replaces a run of zeros with a count marker', () => {
  const input = bytes(1, 0, 0, 0, 2);
  const output = encode(input);
  // 1, marker(0, 0,0,0,3), 2
  assert.deepEqual(Array.from(output), [1, 0, 0, 0, 0, 3, 2]);
});

test('encode leaves non-zero bytes untouched', () => {
  const input = bytes(1, 2, 3);
  const output = encode(input);
  assert.deepEqual(Array.from(output), [1, 2, 3]);
});

test('encode handles a single zero', () => {
  const input = bytes(0);
  const output = encode(input);
  assert.deepEqual(Array.from(output), [0, 0, 0, 0, 1]);
});

test('encode handles an empty input', () => {
  const input = bytes();
  const output = encode(input);
  assert.deepEqual(Array.from(output), []);
});

test('encode handles a run that spans the whole input', () => {
  const input = bytes(0, 0, 0, 0, 0);
  const output = encode(input);
  assert.deepEqual(Array.from(output), [0, 0, 0, 0, 5]);
});

test('encode handles multiple runs separated by non-zero bytes', () => {
  const input = bytes(0, 0, 7, 0, 0, 0, 8);
  const output = encode(input);
  assert.deepEqual(
    Array.from(output),
    [0, 0, 0, 0, 2, 7, 0, 0, 0, 0, 3, 8],
  );
});

test('decode reverses encode for a simple run', () => {
  const original = bytes(1, 0, 0, 0, 2);
  const roundTrip = decode(encode(original));
  assert.deepEqual(Array.from(roundTrip), Array.from(original));
});

test('decode reverses encode for empty input', () => {
  const original = bytes();
  const roundTrip = decode(encode(original));
  assert.deepEqual(Array.from(roundTrip), Array.from(original));
});

test('decode reverses encode for all zeros', () => {
  const original = bytes(0, 0, 0, 0, 0);
  const roundTrip = decode(encode(original));
  assert.deepEqual(Array.from(roundTrip), Array.from(original));
});

test('decode throws on a truncated run marker', () => {
  const truncated = bytes(0, 0, 0, 0);
  assert.throws(() => decode(truncated), /truncated run marker/);
});

test('decode throws on a marker with a missing count byte', () => {
  const truncated = bytes(0, 0, 0);
  assert.throws(() => decode(truncated), /truncated run marker/);
});

test('decode throws on a lone zero byte', () => {
  const truncated = bytes(0);
  assert.throws(() => decode(truncated), /truncated run marker/);
});

test('encode and decode round-trip a mixed stream', () => {
  const original = bytes(9, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0);
  const roundTrip = decode(encode(original));
  assert.deepEqual(Array.from(roundTrip), Array.from(original));
});

test('encode rejects non-Uint8Array input', () => {
  assert.throws(() => encode([1, 2, 3]), /Uint8Array/);
});

test('decode rejects non-Uint8Array input', () => {
  assert.throws(() => decode([1, 2, 3]), /Uint8Array/);
});
