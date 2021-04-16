import {
  ArrayType,
  CompleteType,
  ContainerTypeCode,
  DictEntryType,
} from '../parse';
import {isArray} from '../predicates/is-array';

export function createArrayType<
  TElementType extends CompleteType | DictEntryType<any, any>
>(elementType: TElementType): ArrayType<TElementType> {
  return {
    typeCode: ContainerTypeCode.Array,
    bytePadding: 4,
    predicate: isArray,
    elementType,
  };
}
