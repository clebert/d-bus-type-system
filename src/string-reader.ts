export class StringReader {
  readonly #value: string;

  #position: number = 0;

  constructor(value: string) {
    this.#value = value;
  }

  readChar(): string | undefined {
    const char = this.#value[this.#position];

    this.#position += 1;

    return char;
  }

  resetChar(): void {
    this.#position -= 1;

    return undefined;
  }
}
