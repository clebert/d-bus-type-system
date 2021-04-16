import {
  BasicType,
  CompleteType,
  ContainerTypeCode,
  DictEntryType,
} from '../parse';
import {isDictEntry} from '../predicates/is-dict-entry';

export function createDictEntryType<
  TKeyType extends BasicType,
  TValueType extends CompleteType
>(
  keyType: TKeyType,
  valueType: TValueType
): DictEntryType<TKeyType, TValueType> {
  return {
    typeCode: ContainerTypeCode.DictEntry,
    bytePadding: 8,
    predicate: isDictEntry,
    keyType,
    valueType,
  };
}
