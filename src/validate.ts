import {CompleteType, DictEntryType, Predicate} from './parse';

export function validate<TType extends CompleteType | DictEntryType>(
  type: TType,
  value: unknown
): TType['predicate'] extends Predicate<infer TValue> ? TValue : never;

export function validate(
  type: CompleteType | DictEntryType,
  value: unknown
): unknown {
  if (!type.predicate(value)) {
    throw new Error(`invalid-value=${JSON.stringify(value)}`);
  }

  return value;
}
