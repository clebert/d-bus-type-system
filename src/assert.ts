import {
  ArrayType,
  BasicType,
  CompleteType,
  DictEntryType,
  Predicate,
  StructType,
  VariantType,
} from './parse';

export type CompleteValue<TType extends CompleteType> = TType extends BasicType
  ? BasicValue<TType>
  : TType extends ArrayType<any>
  ? ArrayValue<TType>
  : TType extends StructType<any>
  ? StructValue<TType>
  : TType extends VariantType
  ? VariantValue
  : never;

export type BasicValue<
  TType extends BasicType
> = TType['predicate'] extends Predicate<infer TValue> ? TValue : never;

export type ArrayValue<TType> = TType extends ArrayType<infer TElementType>
  ? TElementType extends CompleteType
    ? readonly CompleteValue<TElementType>[]
    : TElementType extends DictEntryType<any, any>
    ? DictEntryValue<TElementType>
    : never
  : never;

export type StructValue<TType> = TType extends StructType<infer TFieldTypes>
  ? CompleteValues<TFieldTypes>
  : never;

export type CompleteValues<TTypes extends readonly CompleteType[]> = {
  [TKey in keyof TTypes]: TTypes[TKey] extends CompleteType
    ? CompleteValue<TTypes[TKey]>
    : never;
};

export type VariantValue = readonly [string, unknown];

export type DictEntryValue<TType> = TType extends DictEntryType<
  infer TKeyType,
  infer TValueType
>
  ? readonly [BasicValue<TKeyType>, CompleteValue<TValueType>]
  : never;

/**
 * This function exists only to determine the type of the passed value for
 * TypeScript. It does nothing at runtime, so it should only be used if you are
 * sure that the type passed in matches the value passed in.
 */
export function assert<TType extends CompleteType>(
  _type: TType,
  _value: unknown
): asserts _value is CompleteValue<TType> {}
