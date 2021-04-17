import {
  ArrayType,
  BasicType,
  CompleteType,
  ContainerTypeCode,
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

export function assert<TType extends CompleteType | DictEntryType<any, any>>(
  type: TType,
  value: unknown,
  shallowTypeInference: true,
  typeName?: string
): asserts value is TType['predicate'] extends Predicate<infer TValue>
  ? TValue
  : never;

export function assert<TType extends CompleteType | DictEntryType<any, any>>(
  type: TType,
  value: unknown,
  shallowTypeInference?: false,
  typeName?: string
): asserts value is TType extends CompleteType
  ? CompleteValue<TType>
  : TType extends DictEntryType<any, any>
  ? DictEntryValue<TType>
  : never;

export function assert(
  type: CompleteType | DictEntryType<any, any>,
  value: unknown,
  _shallowTypeInference?: boolean,
  typeName: string = ''
): void {
  try {
    switch (type.typeCode) {
      case ContainerTypeCode.Array: {
        if (type.predicate(value)) {
          value.forEach((element, index) => {
            assert(
              type.elementType,
              element,
              true,
              `${type.typeCode}[${index}]`
            );
          });

          return;
        }

        break;
      }
      case ContainerTypeCode.Struct: {
        if (type.predicate(value)) {
          if (value.length < type.fieldTypes.length) {
            throw new Error(
              `invalid-length=${JSON.stringify(value)}; actual=${
                value.length
              }; expected=${type.fieldTypes.length}`
            );
          }

          if (value.length > type.fieldTypes.length) {
            throw new Error(
              `invalid-length=${JSON.stringify(value)}; actual=${
                value.length
              }; expected=${type.fieldTypes.length}`
            );
          }

          value.forEach((field, index) => {
            assert(
              type.fieldTypes[index],
              field,
              true,
              `${type.typeCode}[${index}]`
            );
          });

          return;
        }

        break;
      }
      case ContainerTypeCode.Variant: {
        if (type.predicate(value)) {
          return;
        }

        break;
      }
      case ContainerTypeCode.DictEntry: {
        if (type.predicate(value)) {
          assert(type.keyType, value[0], true, `${type.typeCode}[0]`);
          assert(type.valueType, value[1], true, `${type.typeCode}[1]`);

          return;
        }

        break;
      }
    }

    if (type.predicate(value)) {
      return;
    }

    throw new Error(`assertion-failed=${JSON.stringify(value)}`);
  } catch (error) {
    throw new Error(
      `type=${type.typeCode}${typeName ? `=${typeName}` : ''}; ${error.message}`
    );
  }
}
