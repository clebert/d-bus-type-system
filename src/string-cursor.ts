export class StringCursor {
  readonly #value: string;

  #position: number = 0;

  constructor(value: string) {
    this.#value = value;
  }

  next(): string | undefined {
    const char = this.#value[this.#position];

    this.#position += 1;

    return char;
  }

  undo(): void {
    this.#position -= 1;

    return undefined;
  }
}
