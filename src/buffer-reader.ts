export interface BufferReaderOptions {
  readonly littleEndian?: boolean;
  readonly byteOffset?: number;
}

export class BufferReader {
  readonly buffer: ArrayBuffer;
  readonly littleEndian: boolean;

  #byteOffset: number;

  get byteOffset(): number {
    return this.#byteOffset;
  }

  constructor(buffer: ArrayBuffer, options: BufferReaderOptions = {}) {
    this.buffer = buffer;
    this.littleEndian = options.littleEndian ?? false;
    this.#byteOffset = options.byteOffset ?? 0;
  }

  align(bytePadding: number): this {
    const byteRemainder = this.#byteOffset % bytePadding;

    if (byteRemainder > 0) {
      try {
        this.#getDataView(bytePadding - byteRemainder);
      } catch (error) {
        throw new Error(`alignment; ${error.message}`);
      }
    }

    return this;
  }

  readUint8(): number {
    return this.#getDataView(1).getUint8(0);
  }

  readInt16(): number {
    return this.#getDataView(2).getInt16(0, this.littleEndian);
  }

  readUint16(): number {
    return this.#getDataView(2).getUint16(0, this.littleEndian);
  }

  readInt32(): number {
    return this.#getDataView(4).getInt32(0, this.littleEndian);
  }

  readUint32(): number {
    return this.#getDataView(4).getUint32(0, this.littleEndian);
  }

  readBigInt64(): bigint {
    return this.#getDataView(8).getBigInt64(0, this.littleEndian);
  }

  readBigUint64(): bigint {
    return this.#getDataView(8).getBigUint64(0, this.littleEndian);
  }

  readFloat64(): number {
    return this.#getDataView(8).getFloat64(0, this.littleEndian);
  }

  readBytes(byteLength: number): ArrayBuffer {
    return this.#getDataView(byteLength).buffer.slice(
      this.#byteOffset - byteLength,
      this.#byteOffset
    );
  }

  readonly #getDataView = (byteLength: number): DataView => {
    const remainingByteLength = Math.max(
      this.buffer.byteLength - this.#byteOffset,
      0
    );

    if (byteLength > remainingByteLength) {
      throw new Error(
        `byte-offset=${this.#byteOffset}; out-of-bounds=${
          byteLength - remainingByteLength
        }`
      );
    }

    try {
      return new DataView(this.buffer, this.#byteOffset, byteLength);
    } finally {
      this.#byteOffset += byteLength;
    }
  };
}
