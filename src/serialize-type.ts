import type {CompleteType, DictEntryType} from './types.js';
import {BasicTypeCode, ContainerTypeCode} from './types.js';

export function serializeType(
  type: CompleteType | DictEntryType<any, any>,
): string {
  switch (type.typeCode) {
    case BasicTypeCode.Uint8:
    case BasicTypeCode.Int16:
    case BasicTypeCode.Uint16:
    case BasicTypeCode.Int32:
    case BasicTypeCode.Uint32:
    case BasicTypeCode.BigInt64:
    case BasicTypeCode.BigUint64:
    case BasicTypeCode.Float64:
    case BasicTypeCode.Boolean:
    case BasicTypeCode.UnixFd:
    case BasicTypeCode.String:
    case BasicTypeCode.ObjectPath:
    case BasicTypeCode.Signature:
    case ContainerTypeCode.Variant: {
      return type.typeCode;
    }
    case ContainerTypeCode.Array: {
      return `${type.typeCode}${serializeType(type.elementType)}`;
    }
    case ContainerTypeCode.Struct: {
      return `(${type.fieldTypes.map(serializeType).join(``)})`;
    }
    case ContainerTypeCode.DictEntry: {
      return `{${serializeType(type.keyType)}${serializeType(type.valueType)}}`;
    }
  }
}
