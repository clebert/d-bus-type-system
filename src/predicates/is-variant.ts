import {isArray} from './is-array';
import {isString} from './is-string';

export function isVariant(value: unknown): value is readonly [string, unknown] {
  return isArray(value) && value.length === 2 && isString(value[0]);
}
