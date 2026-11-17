const ZERO = 0;

/**
 * Encodes a byte stream by replacing runs of zero bytes with a count marker.
 * The format is: a zero byte followed by a 4-byte big-endian unsigned integer
 * count of how many zeros were in the run. Non-zero bytes are emitted as-is.
 *
 * Why this format: it is unambiguous because a zero byte in the output always
 * starts a run marker. The count is big-endian so the format is portable across
 * architectures and easy to inspect with a hex dump.
 *
 * @param {Uint8Array} input - The bytes to compress.
 * @returns {Uint8Array} The compressed bytes.
 */
export function encode(input) {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError('input must be a Uint8Array');
  }

  const out = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    if (input[i] !== ZERO) {
      out.push(input[i]);
      i++;
      continue;
    }

    // Count the run of zeros starting at i.
    let runLength = 0;
    while (i < len && input[i] === ZERO) {
      runLength++;
      i++;
    }

    // A run marker is a zero byte followed by a 4-byte big-endian count.
    out.push(ZERO);
    out.push((runLength >>> 24) & 0xff);
    out.push((runLength >>> 16) & 0xff);
    out.push((runLength >>> 8) & 0xff);
    out.push(runLength & 0xff);
  }

  return new Uint8Array(out);
}

/**
 * Decodes bytes produced by encode back into the original stream.
 *
 * @param {Uint8Array} input - The compressed bytes.
 * @returns {Uint8Array} The original bytes.
 * @throws {Error} If the input ends in the middle of a run marker.
 */
export function decode(input) {
  if (!(input instanceof Uint8Array)) {
    throw new TypeError('input must be a Uint8Array');
  }

  const out = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const byte = input[i];

    if (byte !== ZERO) {
      out.push(byte);
      i++;
      continue;
    }

    // The zero byte must be followed by a 4-byte big-endian count.
    if (i + 4 >= len) {
      throw new Error('truncated run marker');
    }

    const count =
      ((input[i + 1] << 24) |
        (input[i + 2] << 16) |
        (input[i + 3] << 8) |
        input[i + 4]) >>> 0;

    for (let j = 0; j < count; j++) {
      out.push(ZERO);
    }

    i += 5;
  }

  return new Uint8Array(out);
}
