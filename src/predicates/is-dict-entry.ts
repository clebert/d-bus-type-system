import {isArray} from './is-array';

export function isDictEntry(
  value: unknown
): value is readonly [unknown, unknown] {
  return isArray(value) && value.length === 2;
}
