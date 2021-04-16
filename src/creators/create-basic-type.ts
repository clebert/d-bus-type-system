import {
  BasicType,
  BasicTypeCode,
  BigInt64Type,
  BigUint64Type,
  BooleanType,
  Float64Type,
  Int16Type,
  Int32Type,
  ObjectPathType,
  SignatureType,
  StringType,
  Uint16Type,
  Uint32Type,
  Uint8Type,
  UnixFdType,
} from '../parse';
import {isBigint} from '../predicates/is-bigint';
import {isBoolean} from '../predicates/is-boolean';
import {isNumber} from '../predicates/is-number';
import {isObjectPath} from '../predicates/is-object-path';
import {isString} from '../predicates/is-string';

export function createBasicType<TTypeCode extends BasicTypeCode>(
  typeCode: TTypeCode
): TTypeCode extends BasicTypeCode.Uint8
  ? Uint8Type
  : TTypeCode extends BasicTypeCode.Int16
  ? Int16Type
  : TTypeCode extends BasicTypeCode.Uint16
  ? Uint16Type
  : TTypeCode extends BasicTypeCode.Int32
  ? Int32Type
  : TTypeCode extends BasicTypeCode.Uint32
  ? Uint32Type
  : TTypeCode extends BasicTypeCode.BigInt64
  ? BigInt64Type
  : TTypeCode extends BasicTypeCode.BigUint64
  ? BigUint64Type
  : TTypeCode extends BasicTypeCode.Float64
  ? Float64Type
  : TTypeCode extends BasicTypeCode.Boolean
  ? BooleanType
  : TTypeCode extends BasicTypeCode.UnixFd
  ? UnixFdType
  : TTypeCode extends BasicTypeCode.String
  ? StringType
  : TTypeCode extends BasicTypeCode.ObjectPath
  ? ObjectPathType
  : TTypeCode extends BasicTypeCode.Signature
  ? SignatureType
  : never;

export function createBasicType(typeCode: BasicTypeCode): BasicType {
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
}
