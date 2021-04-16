import {ContainerTypeCode, VariantType} from '../parse';
import {isVariant} from '../predicates/is-variant';

export function createVariantType(): VariantType {
  return {
    typeCode: ContainerTypeCode.Variant,
    bytePadding: 1,
    predicate: isVariant,
  };
}