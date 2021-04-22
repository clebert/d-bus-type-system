export type CompleteType = BasicType | ContainerType;

export type BasicType =
  | typeof uint8Type
  | typeof int16Type
  | typeof uint16Type
  | typeof int32Type
  | typeof uint32Type
  | typeof bigInt64Type
  | typeof bigUint64Type
  | typeof float64Type
  | typeof booleanType
  | typeof unixFdType
  | typeof stringType
  | typeof objectPathType
  | typeof signatureType;

export enum BasicTypeCode {
  Uint8 = 'y',
  Int16 = 'n',
  Uint16 = 'q',
  Int32 = 'i',
  Uint32 = 'u',
  BigInt64 = 'x',
  BigUint64 = 't',
  Float64 = 'd',
  Boolean = 'b',
  UnixFd = 'h',
  String = 's',
  ObjectPath = 'o',
  Signature = 'g',
}

export type ContainerType =
  | ArrayType<any>
  | StructType<readonly [any, ...any[]]>
  | VariantType;

export interface ArrayType<
  TElementType extends CompleteType | DictEntryType<any, any>
> {
  readonly typeCode: ContainerTypeCode.Array;
  readonly bytePadding: 4;
  readonly predicate: Predicate<readonly unknown[]>;
  readonly elementType: TElementType;
}

export interface StructType<
  TFieldTypes extends readonly [CompleteType, ...CompleteType[]]
> {
  readonly typeCode: ContainerTypeCode.Struct;
  readonly bytePadding: 8;
  readonly predicate: Predicate<readonly [unknown, ...unknown[]]>;
  readonly fieldTypes: TFieldTypes;
}

export interface VariantType {
  readonly typeCode: ContainerTypeCode.Variant;
  readonly bytePadding: 1;
  readonly predicate: Predicate<readonly [CompleteType, unknown]>;
}

export interface DictEntryType<
  TKeyType extends BasicType,
  TValueType extends CompleteType
> {
  readonly typeCode: ContainerTypeCode.DictEntry;
  readonly bytePadding: 8;
  readonly predicate: Predicate<readonly [unknown, unknown]>;
  readonly keyType: TKeyType;
  readonly valueType: TValueType;
}

export enum ContainerTypeCode {
  Array = 'a',
  Struct = 'r', // (...)
  Variant = 'v',
  DictEntry = 'e', // {...}
}

export type Predicate<TValue> = (value: unknown) => value is TValue;

export const uint8Type = {
  typeCode: BasicTypeCode.Uint8,
  bytePadding: 1,
  predicate: (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= uint8Type.minValue &&
    value <= uint8Type.maxValue,
  minValue: 0,
  maxValue: 255,
} as const;

export const int16Type = {
  typeCode: BasicTypeCode.Int16,
  bytePadding: 2,
  predicate: (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= int16Type.minValue &&
    value <= int16Type.maxValue,
  minValue: -32768,
  maxValue: 32767,
} as const;

export const uint16Type = {
  typeCode: BasicTypeCode.Uint16,
  bytePadding: 2,
  predicate: (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= uint16Type.minValue &&
    value <= uint16Type.maxValue,
  minValue: 0,
  maxValue: 65535,
} as const;

export const int32Type = {
  typeCode: BasicTypeCode.Int32,
  bytePadding: 4,
  predicate: (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= int32Type.minValue &&
    value <= int32Type.maxValue,
  minValue: -2147483648,
  maxValue: 2147483647,
} as const;

export const uint32Type = {
  typeCode: BasicTypeCode.Uint32,
  bytePadding: 4,
  predicate: (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= uint32Type.minValue &&
    value <= uint32Type.maxValue,
  minValue: 0,
  maxValue: 4294967295,
} as const;

export const bigInt64Type = {
  typeCode: BasicTypeCode.BigInt64,
  bytePadding: 8,
  predicate: (value: unknown): value is bigint =>
    typeof value === 'bigint' &&
    value >= bigInt64Type.minValue &&
    value <= bigInt64Type.maxValue,
  minValue: -9223372036854775808n,
  maxValue: 9223372036854775807n,
} as const;

export const bigUint64Type = {
  typeCode: BasicTypeCode.BigUint64,
  bytePadding: 8,
  predicate: (value: unknown): value is bigint =>
    typeof value === 'bigint' &&
    value >= bigUint64Type.minValue &&
    value <= bigUint64Type.maxValue,
  minValue: 0n,
  maxValue: 18446744073709551615n,
} as const;

export const float64Type = {
  typeCode: BasicTypeCode.Float64,
  bytePadding: 8,
  predicate: (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value),
} as const;

export const booleanType = {
  typeCode: BasicTypeCode.Boolean,
  bytePadding: 4,
  predicate: (value: unknown): value is boolean => typeof value === 'boolean',
} as const;

export const unixFdType = {
  typeCode: BasicTypeCode.UnixFd,
  bytePadding: 4,
  predicate: uint32Type.predicate,
} as const;

export const stringType = {
  typeCode: BasicTypeCode.String,
  bytePadding: 4,
  predicate: (value: unknown): value is string => typeof value === 'string',
} as const;

export const objectPathType = {
  typeCode: BasicTypeCode.ObjectPath,
  bytePadding: 4,
  predicate: (value: unknown): value is string =>
    typeof value === 'string' && /^\/$|^(\/[A-Za-z0-9_]+)+$/.test(value),
} as const;

export const signatureType = {
  typeCode: BasicTypeCode.Signature,
  bytePadding: 1,
  predicate: (value: unknown): value is string => typeof value === 'string',
} as const;

const isArray = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value);

export const arrayType = <
  TElementType extends CompleteType | DictEntryType<any, any>
>(
  elementType: TElementType
): ArrayType<TElementType> => ({
  typeCode: ContainerTypeCode.Array,
  bytePadding: 4,
  predicate: isArray,
  elementType,
});

const isStruct = (value: unknown): value is readonly [unknown, ...unknown[]] =>
  Array.isArray(value) && value.length > 0;

export const structType = <
  TFieldTypes extends readonly [CompleteType, ...CompleteType[]]
>(
  ...fieldTypes: TFieldTypes
): StructType<TFieldTypes> => ({
  typeCode: ContainerTypeCode.Struct,
  bytePadding: 8,
  predicate: isStruct,
  fieldTypes,
});

const isVariant = (
  value: unknown
): value is readonly [CompleteType, unknown] => {
  if (!Array.isArray(value) || value.length !== 2) {
    return false;
  }

  switch (value[0]?.typeCode) {
    case BasicTypeCode.Uint8:
    case BasicTypeCode.Int16:
    case BasicTypeCode.Uint16:
    case BasicTypeCode.Int32:
    case BasicTypeCode.Uint32:
    case BasicTypeCode.BigInt64:
    case BasicTypeCode.BigUint64:
    case BasicTypeCode.Float64:
    case BasicTypeCode.Boolean:
    case BasicTypeCode.UnixFd:
    case BasicTypeCode.String:
    case BasicTypeCode.ObjectPath:
    case BasicTypeCode.Signature:
    case ContainerTypeCode.Array:
    case ContainerTypeCode.Struct:
    case ContainerTypeCode.Variant: {
      return true;
    }
  }

  return false;
};

export const variantType: VariantType = {
  typeCode: ContainerTypeCode.Variant,
  bytePadding: 1,
  predicate: isVariant,
};

const isDictEntry = (value: unknown): value is readonly [unknown, unknown] =>
  Array.isArray(value) && value.length === 2;

export const dictEntryType = <
  TKeyType extends BasicType,
  TValueType extends CompleteType
>(
  keyType: TKeyType,
  valueType: TValueType
): DictEntryType<TKeyType, TValueType> => ({
  typeCode: ContainerTypeCode.DictEntry,
  bytePadding: 8,
  predicate: isDictEntry,
  keyType,
  valueType,
});
