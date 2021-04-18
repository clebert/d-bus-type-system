import {CompleteType, ContainerTypeCode, DictEntryType} from './parse';

export function serialize(
  type: CompleteType | DictEntryType<any, any>
): string {
  switch (type.typeCode) {
    case ContainerTypeCode.Array: {
      return `${type.typeCode}${serialize(type.elementType)}`;
    }
    case ContainerTypeCode.Struct: {
      return `(${type.fieldTypes.map(serialize).join('')})`;
    }
    case ContainerTypeCode.DictEntry: {
      return `{${serialize(type.keyType)}${serialize(type.valueType)}}`;
    }
  }

  return type.typeCode;
}
