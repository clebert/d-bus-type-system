import {assertType} from './assert-type';
import {BufferReader} from './buffer-reader';
import {parseTypes} from './parse-types';
import {
  BasicTypeCode,
  CompleteType,
  ContainerTypeCode,
  DictEntryType,
  signatureType,
  uint32Type,
  uint8Type,
} from './types';

export function unmarshal(
  wireFormatReader: BufferReader,
  type: CompleteType | DictEntryType<any, any>,
  typeName: string = ''
): unknown {
  try {
    wireFormatReader.align(type.bytePadding);

    switch (type.typeCode) {
      case BasicTypeCode.Uint8: {
        return wireFormatReader.readUint8();
      }
      case BasicTypeCode.Int16: {
        return wireFormatReader.readInt16();
      }
      case BasicTypeCode.Uint16: {
        return wireFormatReader.readUint16();
      }
      case BasicTypeCode.Int32: {
        return wireFormatReader.readInt32();
      }
      case BasicTypeCode.Uint32:
      case BasicTypeCode.UnixFd: {
        return wireFormatReader.readUint32();
      }
      case BasicTypeCode.BigInt64: {
        return wireFormatReader.readBigInt64();
      }
      case BasicTypeCode.BigUint64: {
        return wireFormatReader.readBigUint64();
      }
      case BasicTypeCode.Float64: {
        return wireFormatReader.readFloat64();
      }
      case BasicTypeCode.Boolean: {
        const {byteOffset} = wireFormatReader;
        const value = wireFormatReader.readUint32();

        if (value === 1) {
          return true;
        }

        if (value === 0) {
          return false;
        }

        throw new Error(`byte-offset=${byteOffset}; invalid-value=${value}`);
      }
      case BasicTypeCode.String:
      case BasicTypeCode.ObjectPath:
      case BasicTypeCode.Signature: {
        const byteLength = unmarshal(
          wireFormatReader,
          type.typeCode === BasicTypeCode.Signature ? uint8Type : uint32Type,
          'byte-length'
        );

        const value = new TextDecoder().decode(
          wireFormatReader.readBytes(byteLength as number)
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

        assertType(type, value, true);

        return value;
      }
      case ContainerTypeCode.Array: {
        const {byteOffset} = wireFormatReader;

        const byteLength = unmarshal(
          wireFormatReader,
          uint32Type,
          'byte-length'
        );

        try {
          wireFormatReader.align(type.elementType.bytePadding);
        } catch (error) {
          throw new Error(
            `type=${type.elementType.typeCode}=${type.typeCode}[0]; ${error.message}`
          );
        }

        const finalByteOffset =
          wireFormatReader.byteOffset + (byteLength as number);

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
              (byteLength as number) +
              (wireFormatReader.byteOffset - finalByteOffset)
            }; expected=${byteLength}`
          );
        }

        return elements;
      }
      case ContainerTypeCode.Struct: {
        return type.fieldTypes.map((fieldType, index) =>
          unmarshal(wireFormatReader, fieldType, `${type.typeCode}[${index}]`)
        );
      }
      case ContainerTypeCode.Variant: {
        const variantSignature = unmarshal(
          wireFormatReader,
          signatureType,
          `${type.typeCode}[0]`
        );

        const variantTypes = parseTypes(variantSignature as string);

        if (variantTypes.length > 1) {
          throw new Error(
            `signature=${JSON.stringify(
              variantSignature
            )}; expected-single-complete-type`
          );
        }

        return [
          variantTypes[0],
          unmarshal(wireFormatReader, variantTypes[0], `${type.typeCode}[1]`),
        ];
      }
      case ContainerTypeCode.DictEntry: {
        return [
          unmarshal(wireFormatReader, type.keyType, `${type.typeCode}[0]`),
          unmarshal(wireFormatReader, type.valueType, `${type.typeCode}[1]`),
        ];
      }
    }
  } catch (error) {
    throw error.message.startsWith(`type=${type.typeCode};`)
      ? error
      : new Error(
          `type=${type.typeCode}${typeName ? `=${typeName}` : ''}; ${
            error.message
          }`
        );
  }
}
