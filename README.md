# zero-run-length-ts

Compresses byte streams by replacing runs of zero bytes with a count marker.

```js
import { encode, decode } from 'zero-run-length-ts';

const original = new Uint8Array([1, 0, 0, 0, 2]);
const compressed = encode(original);
// Uint8Array [1, 0, 0, 0, 0, 3, 2]

const restored = decode(compressed);
// Uint8Array [1, 0, 0, 0, 2]
```

## Why this exists

Sparse byte streams — sensor dumps, fixed-width numeric tables, sparse matrices
stored row-major — are often mostly zeros with occasional non-zero values. A
plain run-length encoder that encodes every run, zero or not, spends at least two
bytes per run and makes dense regions larger. This library makes a narrower
trade-off: only zero runs are compressed. Non-zero bytes are copied verbatim, so
dense regions grow by exactly zero bytes, and sparse regions shrink to five
bytes per run regardless of run length.

The cost of that decision is that the encoder cannot compress runs of any other
repeated byte. A stream of `0xAA` bytes is emitted unchanged. That is the
trade-off: pay nothing on dense data, give up compression on non-zero runs.

## Format

A zero byte in the output always begins a run marker. The marker is a single
zero byte followed by a 4-byte big-endian unsigned integer giving the number of
zeros in the run. Any other byte is emitted as-is. The count is big-endian so
the output is byte-identical regardless of the host architecture.

## The awkward edge

A run length is stored as a 32-bit unsigned integer, so a single run can encode
at most 4,294,967,295 zeros. Longer runs are split into multiple markers by the
encoder, which is transparent to `decode`. The decoder also rejects input that
ends in the middle of a marker by throwing `Error('truncated run marker')`; it
does not silently pad the count.

## API

### `encode(input: Uint8Array): Uint8Array`

Returns a new `Uint8Array` containing the compressed form of `input`. Throws a
`TypeError` if `input` is not a `Uint8Array`.

### `decode(input: Uint8Array): Uint8Array`

Returns a new `Uint8Array` containing the original bytes. Throws a `TypeError`
if `input` is not a `Uint8Array`, and an `Error` if the input ends in the middle
of a run marker.
