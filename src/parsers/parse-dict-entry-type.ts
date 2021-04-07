import {DictEntryType, TypeCode} from '../parse';
import {isDictEntry} from '../predicates/is-dict-entry';
import {StringReader} from '../string-reader';
import {parseBasicType} from './parse-basic-type';
import {parseCompleteType} from './parse-complete-type';

export function parseDictEntryType(
  signature: StringReader
): DictEntryType | undefined {
  const typeCode = signature.readChar();

  switch (typeCode) {
    case '{': {
      const keyType = parseBasicType(signature);

      if (!keyType) {
        throw new Error(`type=${TypeCode.DictEntry}; invalid-key-type`);
      }

      const valueType = parseCompleteType(signature);

      if (!valueType) {
        throw new Error(`type=${TypeCode.DictEntry}; invalid-value-type`);
      }

      if (signature.readChar() !== '}') {
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

  signature.resetChar();

  return undefined;
}
