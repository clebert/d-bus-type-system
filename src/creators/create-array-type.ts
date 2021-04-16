import {
  ArrayType,
  CompleteType,
  ContainerTypeCode,
  DictEntryType,
} from '../parse';
import {isArray} from '../predicates/is-array';

export function createArrayType(
  elementType: CompleteType | DictEntryType
): ArrayType {
  return {
    typeCode: ContainerTypeCode.Array,
    bytePadding: 4,
    predicate: isArray,
    elementType,
  };
}
