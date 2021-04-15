import {BasicType, TypeCode} from '../parse';
import {isBigint} from '../predicates/is-bigint';
import {isBoolean} from '../predicates/is-boolean';
import {isNumber} from '../predicates/is-number';
import {isObjectPath} from '../predicates/is-object-path';
import {isString} from '../predicates/is-string';
import {StringCursor} from '../string-cursor';

export function parseBasicType(
  signatureCursor: StringCursor
): BasicType | undefined {
  const typeCode = signatureCursor.next();

  switch (typeCode) {
    case TypeCode.Uint8: {
      return {typeCode, bytePadding: 1, predicate: isNumber};
    }
    case TypeCode.Signature: {
      return {typeCode, bytePadding: 1, predicate: isString};
    }
    case TypeCode.Int16:
    case TypeCode.Uint16: {
      return {typeCode, bytePadding: 2, predicate: isNumber};
    }
    case TypeCode.Int32:
    case TypeCode.Uint32:
    case TypeCode.UnixFD: {
      return {typeCode, bytePadding: 4, predicate: isNumber};
    }
    case TypeCode.Boolean: {
      return {typeCode, bytePadding: 4, predicate: isBoolean};
    }
    case TypeCode.String: {
      return {typeCode, bytePadding: 4, predicate: isString};
    }
    case TypeCode.ObjectPath: {
      return {typeCode, bytePadding: 4, predicate: isObjectPath};
    }
    case TypeCode.BigInt64:
    case TypeCode.BigUint64: {
      return {typeCode, bytePadding: 8, predicate: isBigint};
    }
    case TypeCode.Float64: {
      return {typeCode, bytePadding: 8, predicate: isNumber};
    }
  }

  signatureCursor.undo();

  return undefined;
}
