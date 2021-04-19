import {CompleteType, ContainerTypeCode, DictEntryType} from './parse-type';

export function serializeType(
  type: CompleteType | DictEntryType<any, any>
): string {
  switch (type.typeCode) {
    case ContainerTypeCode.Array: {
      return `${type.typeCode}${serializeType(type.elementType)}`;
    }
    case ContainerTypeCode.Struct: {
      return `(${type.fieldTypes.map(serializeType).join('')})`;
    }
    case ContainerTypeCode.DictEntry: {
      return `{${serializeType(type.keyType)}${serializeType(type.valueType)}}`;
    }
  }

  return type.typeCode;
}
