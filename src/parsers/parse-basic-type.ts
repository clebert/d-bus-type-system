import {BasicType, BasicTypeCode} from '../parse';
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
    case BasicTypeCode.Uint8: {
      return {typeCode, bytePadding: 1, predicate: isNumber};
    }
    case BasicTypeCode.Signature: {
      return {typeCode, bytePadding: 1, predicate: isString};
    }
    case BasicTypeCode.Int16:
    case BasicTypeCode.Uint16: {
      return {typeCode, bytePadding: 2, predicate: isNumber};
    }
    case BasicTypeCode.Int32:
    case BasicTypeCode.Uint32:
    case BasicTypeCode.UnixFd: {
      return {typeCode, bytePadding: 4, predicate: isNumber};
    }
    case BasicTypeCode.Boolean: {
      return {typeCode, bytePadding: 4, predicate: isBoolean};
    }
    case BasicTypeCode.String: {
      return {typeCode, bytePadding: 4, predicate: isString};
    }
    case BasicTypeCode.ObjectPath: {
      return {typeCode, bytePadding: 4, predicate: isObjectPath};
    }
    case BasicTypeCode.BigInt64:
    case BasicTypeCode.BigUint64: {
      return {typeCode, bytePadding: 8, predicate: isBigint};
    }
    case BasicTypeCode.Float64: {
      return {typeCode, bytePadding: 8, predicate: isNumber};
    }
  }

  signatureCursor.undo();

  return undefined;
}
