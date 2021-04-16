import {
  BasicType,
  CompleteType,
  ContainerTypeCode,
  DictEntryType,
} from '../parse';
import {isDictEntry} from '../predicates/is-dict-entry';

export function createDictEntryType(
  keyType: BasicType,
  valueType: CompleteType
): DictEntryType {
  return {
    typeCode: ContainerTypeCode.DictEntry,
    bytePadding: 8,
    predicate: isDictEntry,
    keyType,
    valueType,
  };
}
