export interface BufferWriterOptions {
  readonly littleEndian?: boolean;
  readonly byteOffset?: number;
}

export class BufferWriter {
  readonly littleEndian: boolean;

  #buffer: ArrayBuffer;

  constructor(options: BufferWriterOptions = {}) {
    this.littleEndian = options.littleEndian ?? false;
    this.#buffer = new ArrayBuffer(options.byteOffset ?? 0);
  }

  get buffer(): ArrayBuffer {
    return this.#buffer;
  }

  align(bytePadding: number): this {
    const byteRemainder = this.#buffer.byteLength % bytePadding;

    if (byteRemainder > 0) {
      this.#getDataView(bytePadding - byteRemainder);
    }

    return this;
  }

  writeUint8(value: number): this {
    this.#getDataView(1).setUint8(0, value);

    return this;
  }

  writeInt16(value: number): this {
    this.#getDataView(2).setInt16(0, value, this.littleEndian);

    return this;
  }

  writeUint16(value: number): this {
    this.#getDataView(2).setUint16(0, value, this.littleEndian);

    return this;
  }

  writeInt32(value: number): this {
    this.#getDataView(4).setInt32(0, value, this.littleEndian);

    return this;
  }

  writeUint32(value: number): this {
    this.#getDataView(4).setUint32(0, value, this.littleEndian);

    return this;
  }

  writeBigInt64(value: bigint): this {
    this.#getDataView(8).setBigInt64(0, value, this.littleEndian);

    return this;
  }

  writeBigUint64(value: bigint): this {
    this.#getDataView(8).setBigUint64(0, value, this.littleEndian);

    return this;
  }

  writeFloat64(value: number): this {
    this.#getDataView(8).setFloat64(0, value, this.littleEndian);

    return this;
  }

  writeBytes(buffer: ArrayBuffer): this {
    const array = new Uint8Array(this.#buffer.byteLength + buffer.byteLength);

    array.set(new Uint8Array(this.#buffer));
    array.set(new Uint8Array(buffer), this.#buffer.byteLength);

    this.#buffer = array.buffer;

    return this;
  }

  readonly #getDataView = (byteLength: number): DataView => {
    const array = new Uint8Array(this.#buffer.byteLength + byteLength);

    array.set(new Uint8Array(this.#buffer));

    try {
      return new DataView(array.buffer, this.#buffer.byteLength);
    } finally {
      this.#buffer = array.buffer;
    }
  };
}
