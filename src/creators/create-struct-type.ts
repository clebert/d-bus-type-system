import {CompleteType, ContainerTypeCode, StructType} from '../parse';
import {isStruct} from '../predicates/is-struct';

export function createStructType(
  fieldTypes: readonly [CompleteType, ...CompleteType[]]
): StructType {
  return {
    typeCode: ContainerTypeCode.Struct,
    bytePadding: 8,
    predicate: isStruct,
    fieldTypes,
  };
}
