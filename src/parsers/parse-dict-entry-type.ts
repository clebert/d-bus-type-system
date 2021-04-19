import {createDictEntryType} from '../creators/create-dict-entry-type';
import {ContainerTypeCode, DictEntryType} from '../parse-type';
import {StringCursor} from '../string-cursor';
import {parseBasicType} from './parse-basic-type';
import {parseCompleteType} from './parse-complete-type';

export function parseDictEntryType(
  signatureCursor: StringCursor
): DictEntryType<any, any> | undefined {
  const typeCode = signatureCursor.next();

  switch (typeCode) {
    case '{': {
      const keyType = parseBasicType(signatureCursor);

      if (!keyType) {
        throw new Error(
          `type=${ContainerTypeCode.DictEntry}; invalid-key-type`
        );
      }

      const valueType = parseCompleteType(signatureCursor);

      if (!valueType) {
        throw new Error(
          `type=${ContainerTypeCode.DictEntry}; invalid-value-type`
        );
      }

      if (signatureCursor.next() !== '}') {
        signatureCursor.undo();

        throw new Error(`type=${ContainerTypeCode.DictEntry}; unexpected-end`);
      }

      return createDictEntryType(keyType, valueType);
    }
  }

  signatureCursor.undo();

  return undefined;
}
