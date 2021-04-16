export class StringCursor {
  readonly #value: string;

  #offset: number = 0;

  constructor(value: string) {
    this.#value = value;
  }

  get offset(): number {
    return this.#offset;
  }

  next(): string | undefined {
    return this.#value[this.#offset++];
  }

  undo(): void {
    this.#offset -= 1;
  }
}
