import {isString} from './is-string';

export function isObjectPath(value: unknown): value is string {
  return isString(value) && /^\/$|^(\/[A-Za-z0-9_]+)+$/.test(value);
}
