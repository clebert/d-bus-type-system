import {createArrayType} from '../creators/create-array-type';
import {createStructType} from '../creators/create-struct-type';
import {createVariantType} from '../creators/create-variant-type';
import {CompleteType, ContainerType, ContainerTypeCode} from '../parse-type';
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

      return createArrayType(elementType);
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

      return createStructType(fieldType, ...otherFieldTypes);
    }
    case ContainerTypeCode.Variant: {
      return createVariantType();
    }
  }

  signatureCursor.undo();

  return undefined;
}
