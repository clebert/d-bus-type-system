import {parseCompleteType} from './parsers/parse-complete-type';
import {StringCursor} from './string-cursor';

export type CompleteType = BasicType | ContainerType;

export type BasicType =
  | Uint8Type
  | Int16Type
  | Uint16Type
  | Int32Type
  | Uint32Type
  | BigInt64Type
  | BigUint64Type
  | Float64Type
  | BooleanType
  | UnixFDType
  | StringType
  | ObjectPathType
  | SignatureType;

export interface Uint8Type {
  readonly typeCode: TypeCode.Uint8;
  readonly bytePadding: 1;
  readonly predicate: Predicate<number>;
}

export interface Int16Type {
  readonly typeCode: TypeCode.Int16;
  readonly bytePadding: 2;
  readonly predicate: Predicate<number>;
}

export interface Uint16Type {
  readonly typeCode: TypeCode.Uint16;
  readonly bytePadding: 2;
  readonly predicate: Predicate<number>;
}

export interface Int32Type {
  readonly typeCode: TypeCode.Int32;
  readonly bytePadding: 4;
  readonly predicate: Predicate<number>;
}

export interface Uint32Type {
  readonly typeCode: TypeCode.Uint32;
  readonly bytePadding: 4;
  readonly predicate: Predicate<number>;
}

export interface BigInt64Type {
  readonly typeCode: TypeCode.BigInt64;
  readonly bytePadding: 8;
  readonly predicate: Predicate<bigint>;
}

export interface BigUint64Type {
  readonly typeCode: TypeCode.BigUint64;
  readonly bytePadding: 8;
  readonly predicate: Predicate<bigint>;
}

export interface Float64Type {
  readonly typeCode: TypeCode.Float64;
  readonly bytePadding: 8;
  readonly predicate: Predicate<number>;
}

export interface BooleanType {
  readonly typeCode: TypeCode.Boolean;
  readonly bytePadding: 4;
  readonly predicate: Predicate<boolean>;
}

export interface UnixFDType {
  readonly typeCode: TypeCode.UnixFD;
  readonly bytePadding: 4;
  readonly predicate: Predicate<number>;
}

export interface StringType {
  readonly typeCode: TypeCode.String;
  readonly bytePadding: 4;
  readonly predicate: Predicate<string>;
}

export interface ObjectPathType {
  readonly typeCode: TypeCode.ObjectPath;
  readonly bytePadding: 4;
  readonly predicate: Predicate<string>;
}

export interface SignatureType {
  readonly typeCode: TypeCode.Signature;
  readonly bytePadding: 1;
  readonly predicate: Predicate<string>;
}

export type ContainerType = ArrayType | StructType | VariantType;

export interface ArrayType {
  readonly typeCode: TypeCode.Array;
  readonly bytePadding: 4;
  readonly predicate: Predicate<readonly unknown[]>;
  readonly elementType: CompleteType | DictEntryType;
}

export interface StructType {
  readonly typeCode: TypeCode.Struct;
  readonly bytePadding: 8;
  readonly predicate: Predicate<readonly [unknown, ...unknown[]]>;
  readonly fieldTypes: readonly [CompleteType, ...CompleteType[]];
}

export interface VariantType {
  readonly typeCode: TypeCode.Variant;
  readonly bytePadding: 1;
  readonly predicate: Predicate<readonly [string, unknown]>;
}

export interface DictEntryType {
  readonly typeCode: TypeCode.DictEntry;
  readonly bytePadding: 8;
  readonly predicate: Predicate<readonly [unknown, unknown]>;
  readonly keyType: BasicType;
  readonly valueType: CompleteType;
}

export enum TypeCode {
  Uint8 = 'y',
  Int16 = 'n',
  Uint16 = 'q',
  Int32 = 'i',
  Uint32 = 'u',
  BigInt64 = 'x',
  BigUint64 = 't',
  Float64 = 'd',
  Boolean = 'b',
  UnixFD = 'h',
  String = 's',
  ObjectPath = 'o',
  Signature = 'g',
  Array = 'a',
  Struct = 'r', // (...)
  Variant = 'v',
  DictEntry = 'e', // {...}
}

export type Predicate<TValue> = (value: unknown) => value is TValue;

export function parse(signature: string): CompleteType {
  try {
    const signatureCursor = new StringCursor(signature);
    const type = parseCompleteType(signatureCursor);

    if (!type || signatureCursor.next()) {
      throw new Error(`invalid-value=${JSON.stringify(signature)}`);
    }

    return type;
  } catch (error) {
    throw new Error(`signature; ${error.message}`);
  }
}
