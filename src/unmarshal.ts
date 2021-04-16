import {BufferReader} from './buffer-reader';
import {CompleteType, DictEntryType, Predicate, TypeCode, parse} from './parse';
import {isNumber} from './predicates/is-number';
import {isString} from './predicates/is-string';
import {validate} from './validate';

export function unmarshal<TType extends CompleteType | DictEntryType>(
  wireFormatReader: BufferReader,
  type: TType,
  typeName?: string
): TType['predicate'] extends Predicate<infer TValue> ? TValue : never;

export function unmarshal(
  wireFormatReader: BufferReader,
  type: CompleteType | DictEntryType,
  typeName: string = ''
): unknown {
  try {
    wireFormatReader.align(type.bytePadding);

    switch (type.typeCode) {
      case TypeCode.Uint8: {
        return validate(type, wireFormatReader.readUint8());
      }
      case TypeCode.Int16: {
        return validate(type, wireFormatReader.readInt16());
      }
      case TypeCode.Uint16: {
        return validate(type, wireFormatReader.readUint16());
      }
      case TypeCode.Int32: {
        return validate(type, wireFormatReader.readInt32());
      }
      case TypeCode.Uint32:
      case TypeCode.UnixFd: {
        return validate(type, wireFormatReader.readUint32());
      }
      case TypeCode.BigInt64: {
        return validate(type, wireFormatReader.readBigInt64());
      }
      case TypeCode.BigUint64: {
        return validate(type, wireFormatReader.readBigUint64());
      }
      case TypeCode.Float64: {
        return validate(type, wireFormatReader.readFloat64());
      }
      case TypeCode.Boolean: {
        const {byteOffset} = wireFormatReader;
        const value = wireFormatReader.readUint32();

        if (value === 1) {
          return validate(type, true);
        }

        if (value === 0) {
          return validate(type, false);
        }

        throw new Error(`byte-offset=${byteOffset}; invalid-value=${value}`);
      }
      case TypeCode.String:
      case TypeCode.ObjectPath:
      case TypeCode.Signature: {
        const byteLength = unmarshal(
          wireFormatReader,
          type.typeCode === TypeCode.Signature
            ? {typeCode: TypeCode.Uint8, bytePadding: 1, predicate: isNumber}
            : {typeCode: TypeCode.Uint32, bytePadding: 4, predicate: isNumber},
          'byte-length'
        );

        const value = new TextDecoder().decode(
          wireFormatReader.readBytes(byteLength)
        );

        const nulByteIndex = value.indexOf('\u0000');

        if (nulByteIndex > -1) {
          throw new Error(
            `byte-offset=${
              wireFormatReader.byteOffset - (value.length - nulByteIndex)
            }; unexpected-nul-byte`
          );
        }

        const {byteOffset} = wireFormatReader;

        if (wireFormatReader.readUint8() !== 0) {
          throw new Error(`byte-offset=${byteOffset}; expected-nul-byte`);
        }

        return validate(type, value);
      }
      case TypeCode.Array: {
        const {byteOffset} = wireFormatReader;

        const byteLength = unmarshal(
          wireFormatReader,
          {typeCode: TypeCode.Uint32, bytePadding: 4, predicate: isNumber},
          'byte-length'
        );

        try {
          wireFormatReader.align(type.elementType.bytePadding);
        } catch (error) {
          throw new Error(
            `type=${type.elementType.typeCode}=${type.typeCode}[0]; ${error.message}`
          );
        }

        const finalByteOffset = wireFormatReader.byteOffset + byteLength;
        const elements: unknown[] = [];

        while (wireFormatReader.byteOffset < finalByteOffset) {
          elements.push(
            unmarshal(
              wireFormatReader,
              type.elementType,
              `${type.typeCode}[${elements.length}]`
            )
          );
        }

        if (wireFormatReader.byteOffset > finalByteOffset) {
          throw new Error(
            `byte-offset=${byteOffset}; invalid-byte-length; actual=${
              byteLength + (wireFormatReader.byteOffset - finalByteOffset)
            }; expected=${byteLength}`
          );
        }

        return validate(type, elements);
      }
      case TypeCode.Struct: {
        return validate(
          type,
          type.fieldTypes.map((fieldType, index) =>
            unmarshal(wireFormatReader, fieldType, `${type.typeCode}[${index}]`)
          )
        );
      }
      case TypeCode.Variant: {
        const variantSignature = unmarshal(
          wireFormatReader,
          {typeCode: TypeCode.Signature, bytePadding: 1, predicate: isString},
          `${type.typeCode}[0]`
        );

        return validate(type, [
          variantSignature,
          unmarshal(
            wireFormatReader,
            parse(variantSignature),
            `${type.typeCode}[1]`
          ),
        ]);
      }
      case TypeCode.DictEntry: {
        return validate(type, [
          unmarshal(wireFormatReader, type.keyType, `${type.typeCode}[0]`),
          unmarshal(wireFormatReader, type.valueType, `${type.typeCode}[1]`),
        ]);
      }
    }
  } catch (error) {
    throw new Error(
      `type=${type.typeCode}${typeName ? `=${typeName}` : ''}; ${error.message}`
    );
  }
}
