import {BufferReader} from './buffer-reader';
import {createBasicType} from './creators/create-basic-type';
import {
  BasicTypeCode,
  CompleteType,
  ContainerTypeCode,
  DictEntryType,
  Predicate,
  parse,
} from './parse';
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
      case BasicTypeCode.Uint8: {
        return validate(type, wireFormatReader.readUint8());
      }
      case BasicTypeCode.Int16: {
        return validate(type, wireFormatReader.readInt16());
      }
      case BasicTypeCode.Uint16: {
        return validate(type, wireFormatReader.readUint16());
      }
      case BasicTypeCode.Int32: {
        return validate(type, wireFormatReader.readInt32());
      }
      case BasicTypeCode.Uint32:
      case BasicTypeCode.UnixFd: {
        return validate(type, wireFormatReader.readUint32());
      }
      case BasicTypeCode.BigInt64: {
        return validate(type, wireFormatReader.readBigInt64());
      }
      case BasicTypeCode.BigUint64: {
        return validate(type, wireFormatReader.readBigUint64());
      }
      case BasicTypeCode.Float64: {
        return validate(type, wireFormatReader.readFloat64());
      }
      case BasicTypeCode.Boolean: {
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
      case BasicTypeCode.String:
      case BasicTypeCode.ObjectPath:
      case BasicTypeCode.Signature: {
        const byteLength = unmarshal(
          wireFormatReader,
          type.typeCode === BasicTypeCode.Signature
            ? createBasicType(BasicTypeCode.Uint8)
            : createBasicType(BasicTypeCode.Uint32),
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
      case ContainerTypeCode.Array: {
        const {byteOffset} = wireFormatReader;

        const byteLength = unmarshal(
          wireFormatReader,
          createBasicType(BasicTypeCode.Uint32),
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
      case ContainerTypeCode.Struct: {
        return validate(
          type,
          type.fieldTypes.map((fieldType, index) =>
            unmarshal(wireFormatReader, fieldType, `${type.typeCode}[${index}]`)
          )
        );
      }
      case ContainerTypeCode.Variant: {
        const variantSignature = unmarshal(
          wireFormatReader,
          createBasicType(BasicTypeCode.Signature),
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
      case ContainerTypeCode.DictEntry: {
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
