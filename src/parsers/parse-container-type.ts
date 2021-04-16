import {CompleteType, ContainerType, ContainerTypeCode} from '../parse';
import {isArray} from '../predicates/is-array';
import {isStruct} from '../predicates/is-struct';
import {isVariant} from '../predicates/is-variant';
import {StringCursor} from '../string-cursor';
import {parseCompleteType} from './parse-complete-type';
import {parseDictEntryType} from './parse-dict-entry-type';

export function parseContainerType(
  signatureCursor: StringCursor
): ContainerType | undefined {
  const typeCode = signatureCursor.next();

  switch (typeCode) {
    case ContainerTypeCode.Array: {
      const elementType =
        parseCompleteType(signatureCursor) ??
        parseDictEntryType(signatureCursor);

      if (!elementType) {
        throw new Error(`type=${typeCode}; invalid-element-type`);
      }

      return {typeCode, bytePadding: 4, predicate: isArray, elementType};
    }
    case '(': {
      const fieldType = parseCompleteType(signatureCursor);

      if (!fieldType) {
        throw new Error(`type=${ContainerTypeCode.Struct}; invalid-field-type`);
      }

      const otherFieldTypes: CompleteType[] = [];

      let otherFieldType: CompleteType | undefined;

      while ((otherFieldType = parseCompleteType(signatureCursor))) {
        otherFieldTypes.push(otherFieldType);
      }

      if (signatureCursor.next() !== ')') {
        signatureCursor.undo();

        throw new Error(`type=${ContainerTypeCode.Struct}; invalid-field-type`);
      }

      return {
        typeCode: ContainerTypeCode.Struct,
        bytePadding: 8,
        predicate: isStruct,
        fieldTypes: [fieldType, ...otherFieldTypes],
      };
    }
    case ContainerTypeCode.Variant: {
      return {typeCode, bytePadding: 1, predicate: isVariant};
    }
  }

  signatureCursor.undo();

  return undefined;
}
