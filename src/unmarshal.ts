import {BufferReader} from './buffer-reader';
import {CompleteType, DictEntryType, Predicate, TypeCode, parse} from './parse';
import {isNumber} from './predicates/is-number';
import {isString} from './predicates/is-string';

export function unmarshal<TType extends CompleteType | DictEntryType>(
  wireFormat: BufferReader,
  type: TType,
  typeName?: string
): TType['predicate'] extends Predicate<infer TValue> ? TValue : never;

export function unmarshal(
  wireFormat: BufferReader,
  type: CompleteType | DictEntryType,
  typeName: string = ''
): unknown {
  try {
    wireFormat.align(type.bytePadding);

    switch (type.typeCode) {
      case TypeCode.Uint8: {
        return wireFormat.readUint8();
      }
      case TypeCode.Int16: {
        return wireFormat.readInt16();
      }
      case TypeCode.Uint16: {
        return wireFormat.readUint16();
      }
      case TypeCode.Int32: {
        return wireFormat.readInt32();
      }
      case TypeCode.Uint32:
      case TypeCode.UnixFD: {
        return wireFormat.readUint32();
      }
      case TypeCode.BigInt64: {
        return wireFormat.readBigInt64();
      }
      case TypeCode.BigUint64: {
        return wireFormat.readBigUint64();
      }
      case TypeCode.Float64: {
        return wireFormat.readFloat64();
      }
      case TypeCode.Boolean: {
        const {byteOffset} = wireFormat;
        const value = wireFormat.readUint32();

        if (value === 1) {
          return true;
        }

        if (value === 0) {
          return false;
        }

        throw new Error(`byte-offset=${byteOffset}; invalid-value=${value}`);
      }
      case TypeCode.String:
      case TypeCode.ObjectPath:
      case TypeCode.Signature: {
        const byteLength = unmarshal(
          wireFormat,
          type.typeCode === TypeCode.Signature
            ? {typeCode: TypeCode.Uint8, bytePadding: 1, predicate: isNumber}
            : {typeCode: TypeCode.Uint32, bytePadding: 4, predicate: isNumber},
          'byte-length'
        );

        const value = new TextDecoder().decode(
          wireFormat.readBytes(byteLength)
        );

        const nulByteIndex = value.indexOf('\u0000');

        if (nulByteIndex > -1) {
          throw new Error(
            `byte-offset=${
              wireFormat.byteOffset - (value.length - nulByteIndex)
            }; unexpected-nul-byte`
          );
        }

        const {byteOffset} = wireFormat;

        if (wireFormat.readUint8() !== 0) {
          throw new Error(`byte-offset=${byteOffset}; expected-nul-byte`);
        }

        return value;
      }
      case TypeCode.Array: {
        const {byteOffset} = wireFormat;

        const byteLength = unmarshal(
          wireFormat,
          {typeCode: TypeCode.Uint32, bytePadding: 4, predicate: isNumber},
          'byte-length'
        );

        try {
          wireFormat.align(type.elementType.bytePadding);
        } catch (error) {
          throw new Error(
            `type=${type.elementType.typeCode}=element[0]; ${error.message}`
          );
        }

        const finalByteOffset = wireFormat.byteOffset + byteLength;
        const elements: unknown[] = [];

        while (wireFormat.byteOffset < finalByteOffset) {
          elements.push(
            unmarshal(
              wireFormat,
              type.elementType,
              `element[${elements.length}]`
            )
          );
        }

        if (wireFormat.byteOffset > finalByteOffset) {
          throw new Error(
            `byte-offset=${byteOffset}; invalid-byte-length; actual=${
              byteLength + (wireFormat.byteOffset - finalByteOffset)
            }; expected=${byteLength}`
          );
        }

        return elements;
      }
      case TypeCode.Struct: {
        return type.fieldTypes.map((fieldType, index) =>
          unmarshal(wireFormat, fieldType, `field[${index}]`)
        );
      }
      case TypeCode.Variant: {
        const variantSignature = unmarshal(
          wireFormat,
          {typeCode: TypeCode.Signature, bytePadding: 1, predicate: isString},
          'signature'
        );

        return [
          variantSignature,
          unmarshal(wireFormat, parse(variantSignature), 'value'),
        ];
      }
      case TypeCode.DictEntry: {
        return [
          unmarshal(wireFormat, type.keyType, 'key'),
          unmarshal(wireFormat, type.valueType, 'value'),
        ];
      }
    }
  } catch (error) {
    throw new Error(
      `type=${type.typeCode}${typeName ? `=${typeName}` : ''}; ${error.message}`
    );
  }
}
