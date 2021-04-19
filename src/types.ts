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
  readonly predicate: Predicate<readonly [string, unknown]>;
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
  predicate: (value: unknown): value is number => typeof value === 'number',
} as const;

export const int16Type = {
  typeCode: BasicTypeCode.Int16,
  bytePadding: 2,
  predicate: (value: unknown): value is number => typeof value === 'number',
} as const;

export const uint16Type = {
  typeCode: BasicTypeCode.Uint16,
  bytePadding: 2,
  predicate: (value: unknown): value is number => typeof value === 'number',
} as const;

export const int32Type = {
  typeCode: BasicTypeCode.Int32,
  bytePadding: 4,
  predicate: (value: unknown): value is number => typeof value === 'number',
} as const;

export const uint32Type = {
  typeCode: BasicTypeCode.Uint32,
  bytePadding: 4,
  predicate: (value: unknown): value is number => typeof value === 'number',
} as const;

export const bigInt64Type = {
  typeCode: BasicTypeCode.BigInt64,
  bytePadding: 8,
  predicate: (value: unknown): value is bigint => typeof value === 'bigint',
} as const;

export const bigUint64Type = {
  typeCode: BasicTypeCode.BigUint64,
  bytePadding: 8,
  predicate: (value: unknown): value is bigint => typeof value === 'bigint',
} as const;

export const float64Type = {
  typeCode: BasicTypeCode.Float64,
  bytePadding: 8,
  predicate: (value: unknown): value is number => typeof value === 'number',
} as const;

export const booleanType = {
  typeCode: BasicTypeCode.Boolean,
  bytePadding: 4,
  predicate: (value: unknown): value is boolean => typeof value === 'boolean',
} as const;

export const unixFdType = {
  typeCode: BasicTypeCode.UnixFd,
  bytePadding: 4,
  predicate: (value: unknown): value is number => typeof value === 'number',
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

export const arrayType = <
  TElementType extends CompleteType | DictEntryType<any, any>
>(
  elementType: TElementType
): ArrayType<TElementType> => ({
  typeCode: ContainerTypeCode.Array,
  bytePadding: 4,
  predicate: (value): value is readonly unknown[] => Array.isArray(value),
  elementType,
});

export const structType = <
  TFieldTypes extends readonly [CompleteType, ...CompleteType[]]
>(
  ...fieldTypes: TFieldTypes
): StructType<TFieldTypes> => ({
  typeCode: ContainerTypeCode.Struct,
  bytePadding: 8,
  predicate: (value): value is readonly [unknown, ...unknown[]] =>
    Array.isArray(value) && value.length > 0,
  fieldTypes,
});

export const variantType: VariantType = {
  typeCode: ContainerTypeCode.Variant,
  bytePadding: 1,
  predicate: (value): value is readonly [string, unknown] =>
    Array.isArray(value) && value.length === 2 && typeof value[0] === 'string',
};

export const dictEntryType = <
  TKeyType extends BasicType,
  TValueType extends CompleteType
>(
  keyType: TKeyType,
  valueType: TValueType
): DictEntryType<TKeyType, TValueType> => ({
  typeCode: ContainerTypeCode.DictEntry,
  bytePadding: 8,
  predicate: (value): value is readonly [unknown, unknown] =>
    Array.isArray(value) && value.length === 2,
  keyType,
  valueType,
});
