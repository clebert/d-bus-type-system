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
  | UnixFdType
  | StringType
  | ObjectPathType
  | SignatureType;

export interface Uint8Type {
  readonly typeCode: BasicTypeCode.Uint8;
  readonly bytePadding: 1;
  readonly predicate: Predicate<number>;
}

export interface Int16Type {
  readonly typeCode: BasicTypeCode.Int16;
  readonly bytePadding: 2;
  readonly predicate: Predicate<number>;
}

export interface Uint16Type {
  readonly typeCode: BasicTypeCode.Uint16;
  readonly bytePadding: 2;
  readonly predicate: Predicate<number>;
}

export interface Int32Type {
  readonly typeCode: BasicTypeCode.Int32;
  readonly bytePadding: 4;
  readonly predicate: Predicate<number>;
}

export interface Uint32Type {
  readonly typeCode: BasicTypeCode.Uint32;
  readonly bytePadding: 4;
  readonly predicate: Predicate<number>;
}

export interface BigInt64Type {
  readonly typeCode: BasicTypeCode.BigInt64;
  readonly bytePadding: 8;
  readonly predicate: Predicate<bigint>;
}

export interface BigUint64Type {
  readonly typeCode: BasicTypeCode.BigUint64;
  readonly bytePadding: 8;
  readonly predicate: Predicate<bigint>;
}

export interface Float64Type {
  readonly typeCode: BasicTypeCode.Float64;
  readonly bytePadding: 8;
  readonly predicate: Predicate<number>;
}

export interface BooleanType {
  readonly typeCode: BasicTypeCode.Boolean;
  readonly bytePadding: 4;
  readonly predicate: Predicate<boolean>;
}

export interface UnixFdType {
  readonly typeCode: BasicTypeCode.UnixFd;
  readonly bytePadding: 4;
  readonly predicate: Predicate<number>;
}

export interface StringType {
  readonly typeCode: BasicTypeCode.String;
  readonly bytePadding: 4;
  readonly predicate: Predicate<string>;
}

export interface ObjectPathType {
  readonly typeCode: BasicTypeCode.ObjectPath;
  readonly bytePadding: 4;
  readonly predicate: Predicate<string>;
}

export interface SignatureType {
  readonly typeCode: BasicTypeCode.Signature;
  readonly bytePadding: 1;
  readonly predicate: Predicate<string>;
}

export type ContainerType = ArrayType | StructType | VariantType;

export interface ArrayType {
  readonly typeCode: ContainerTypeCode.Array;
  readonly bytePadding: 4;
  readonly predicate: Predicate<readonly unknown[]>;
  readonly elementType: CompleteType | DictEntryType;
}

export interface StructType {
  readonly typeCode: ContainerTypeCode.Struct;
  readonly bytePadding: 8;
  readonly predicate: Predicate<readonly [unknown, ...unknown[]]>;
  readonly fieldTypes: readonly [CompleteType, ...CompleteType[]];
}

export interface VariantType {
  readonly typeCode: ContainerTypeCode.Variant;
  readonly bytePadding: 1;
  readonly predicate: Predicate<readonly [string, unknown]>;
}

export interface DictEntryType {
  readonly typeCode: ContainerTypeCode.DictEntry;
  readonly bytePadding: 8;
  readonly predicate: Predicate<readonly [unknown, unknown]>;
  readonly keyType: BasicType;
  readonly valueType: CompleteType;
}

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

export enum ContainerTypeCode {
  Array = 'a',
  Struct = 'r', // (...)
  Variant = 'v',
  DictEntry = 'e', // {...}
}

export type Predicate<TValue> = (value: unknown) => value is TValue;

export function parse(signature: string): CompleteType {
  const signatureCursor = new StringCursor(signature);

  try {
    const type = parseCompleteType(signatureCursor);

    if (!type) {
      throw new Error('expected-complete-type');
    }

    if (signatureCursor.next()) {
      signatureCursor.undo();

      throw new Error('expected-end');
    }

    return type;
  } catch (error) {
    throw new Error(
      `signature=${JSON.stringify(signature)}; offset=${
        signatureCursor.offset
      }; ${error.message}`
    );
  }
}
