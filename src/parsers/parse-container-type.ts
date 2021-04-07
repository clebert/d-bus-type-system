import {CompleteType, ContainerType, TypeCode} from '../parse';
import {isArray} from '../predicates/is-array';
import {isStruct} from '../predicates/is-struct';
import {isVariant} from '../predicates/is-variant';
import {StringReader} from '../string-reader';
import {parseCompleteType} from './parse-complete-type';
import {parseDictEntryType} from './parse-dict-entry-type';

export function parseContainerType(
  signature: StringReader
): ContainerType | undefined {
  const typeCode = signature.readChar();

  switch (typeCode) {
    case TypeCode.Array: {
      const elementType =
        parseCompleteType(signature) ?? parseDictEntryType(signature);

      if (!elementType) {
        throw new Error(`type=${typeCode}; invalid-element-type`);
      }

      return {typeCode, bytePadding: 4, predicate: isArray, elementType};
    }
    case '(': {
      const fieldType = parseCompleteType(signature);

      if (!fieldType) {
        throw new Error(`type=${TypeCode.Struct}; invalid-field-type`);
      }

      const otherFieldTypes: CompleteType[] = [];

      let otherFieldType: CompleteType | undefined;

      while ((otherFieldType = parseCompleteType(signature))) {
        otherFieldTypes.push(otherFieldType);
      }

      if (signature.readChar() !== ')') {
        throw new Error(`type=${TypeCode.Struct}; invalid-field-type`);
      }

      return {
        typeCode: TypeCode.Struct,
        bytePadding: 8,
        predicate: isStruct,
        fieldTypes: [fieldType, ...otherFieldTypes],
      };
    }
    case TypeCode.Variant: {
      return {typeCode, bytePadding: 1, predicate: isVariant};
    }
  }

  signature.resetChar();

  return undefined;
}
