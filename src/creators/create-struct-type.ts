import {CompleteType, ContainerTypeCode, StructType} from '../parse';
import {isStruct} from '../predicates/is-struct';

export function createStructType<
  TFieldTypes extends readonly [CompleteType, ...CompleteType[]]
>(...fieldTypes: TFieldTypes): StructType<TFieldTypes> {
  return {
    typeCode: ContainerTypeCode.Struct,
    bytePadding: 8,
    predicate: isStruct,
    fieldTypes,
  };
}
