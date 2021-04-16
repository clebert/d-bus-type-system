import {CompleteType, ContainerTypeCode, StructType} from '../parse';
import {isStruct} from '../predicates/is-struct';

export function createStructType<
  TFieldType extends CompleteType,
  TOtherFieldTypes extends readonly CompleteType[]
>(
  fieldType: TFieldType,
  ...otherFieldTypes: TOtherFieldTypes
): StructType<TFieldType, TOtherFieldTypes> {
  return {
    typeCode: ContainerTypeCode.Struct,
    bytePadding: 8,
    predicate: isStruct,
    fieldTypes: [fieldType, ...otherFieldTypes],
  };
}
