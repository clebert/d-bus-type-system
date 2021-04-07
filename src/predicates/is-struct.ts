import {isArray} from './is-array';

export function isStruct(
  value: unknown
): value is readonly [unknown, ...unknown[]] {
  return isArray(value) && value.length > 0;
}
