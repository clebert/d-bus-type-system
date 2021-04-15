import {DictEntryType, TypeCode} from '../parse';
import {isDictEntry} from '../predicates/is-dict-entry';
import {StringCursor} from '../string-cursor';
import {parseBasicType} from './parse-basic-type';
import {parseCompleteType} from './parse-complete-type';

export function parseDictEntryType(
  signatureCursor: StringCursor
): DictEntryType | undefined {
  const typeCode = signatureCursor.next();

  switch (typeCode) {
    case '{': {
      const keyType = parseBasicType(signatureCursor);

      if (!keyType) {
        throw new Error(`type=${TypeCode.DictEntry}; invalid-key-type`);
      }

      const valueType = parseCompleteType(signatureCursor);

      if (!valueType) {
        throw new Error(`type=${TypeCode.DictEntry}; invalid-value-type`);
      }

      if (signatureCursor.next() !== '}') {
        throw new Error(`type=${TypeCode.DictEntry}; unexpected-end`);
      }

      return {
        typeCode: TypeCode.DictEntry,
        bytePadding: 8,
        predicate: isDictEntry,
        keyType,
        valueType,
      };
    }
  }

  signatureCursor.undo();

  return undefined;
}
