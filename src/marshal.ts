import {BufferWriter} from './buffer-writer';
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

export function marshal<TType extends CompleteType | DictEntryType<any, any>>(
  wireFormatWriter: BufferWriter,
  type: TType,
  value: unknown,
  typeName?: string
): asserts value is TType['predicate'] extends Predicate<infer TValue>
  ? TValue
  : never;

export function marshal(
  wireFormatWriter: BufferWriter,
  type: CompleteType | DictEntryType<any, any>,
  value: unknown,
  typeName: string = ''
): void {
  try {
    wireFormatWriter.align(type.bytePadding);

    switch (type.typeCode) {
      case BasicTypeCode.Uint8: {
        wireFormatWriter.writeUint8(validate(type, value));

        return;
      }
      case BasicTypeCode.Int16: {
        wireFormatWriter.writeInt16(validate(type, value));

        return;
      }
      case BasicTypeCode.Uint16: {
        wireFormatWriter.writeUint16(validate(type, value));

        return;
      }
      case BasicTypeCode.Int32: {
        wireFormatWriter.writeInt32(validate(type, value));

        return;
      }
      case BasicTypeCode.Uint32:
      case BasicTypeCode.UnixFd: {
        wireFormatWriter.writeUint32(validate(type, value));

        return;
      }
      case BasicTypeCode.BigInt64: {
        wireFormatWriter.writeBigInt64(validate(type, value));

        return;
      }
      case BasicTypeCode.BigUint64: {
        wireFormatWriter.writeBigUint64(validate(type, value));

        return;
      }
      case BasicTypeCode.Float64: {
        wireFormatWriter.writeFloat64(validate(type, value));

        return;
      }
      case BasicTypeCode.Boolean: {
        wireFormatWriter.writeUint32(validate(type, value) ? 1 : 0);

        return;
      }
      case BasicTypeCode.String:
      case BasicTypeCode.ObjectPath:
      case BasicTypeCode.Signature: {
        const array = new TextEncoder().encode(validate(type, value));

        if (type.typeCode === BasicTypeCode.Signature) {
          wireFormatWriter.writeUint8(array.byteLength);
        } else {
          wireFormatWriter.writeUint32(array.byteLength);
        }

        wireFormatWriter.writeBytes(array.buffer).writeUint8(0);

        return;
      }
      case ContainerTypeCode.Array: {
        const elementWireFormat = new BufferWriter({
          littleEndian: wireFormatWriter.littleEndian,
        });

        const elements = validate(type, value);

        elements.forEach((element, index) => {
          marshal(
            elementWireFormat,
            type.elementType,
            element,
            `${type.typeCode}[${index}]`
          );
        });

        wireFormatWriter
          .writeUint32(elementWireFormat.buffer.byteLength)
          .align(type.elementType.bytePadding)
          .writeBytes(elementWireFormat.buffer);

        return;
      }
      case ContainerTypeCode.Struct: {
        const fields = validate(type, value);

        if (fields.length < type.fieldTypes.length) {
          throw new Error(
            `invalid-number-of-fields=${JSON.stringify(fields)}; actual=${
              fields.length
            }; expected=${type.fieldTypes.length}`
          );
        }

        if (fields.length > type.fieldTypes.length) {
          throw new Error(
            `invalid-number-of-fields=${JSON.stringify(fields)}; actual=${
              fields.length
            }; expected=${type.fieldTypes.length}`
          );
        }

        for (let i = 0; i < fields.length; i += 1) {
          marshal(
            wireFormatWriter,
            type.fieldTypes[i]!,
            fields[i],
            `${type.typeCode}[${i}]`
          );
        }

        return;
      }
      case ContainerTypeCode.Variant: {
        const [variantSignature, variantValue] = validate(type, value);

        marshal(
          wireFormatWriter,
          createBasicType(BasicTypeCode.Signature),
          variantSignature,
          `${type.typeCode}[0]`
        );

        marshal(
          wireFormatWriter,
          parse(variantSignature),
          variantValue,
          `${type.typeCode}[1]`
        );

        return;
      }
      case ContainerTypeCode.DictEntry: {
        const dictEntry = validate(type, value);

        marshal(
          wireFormatWriter,
          type.keyType,
          dictEntry[0],
          `${type.typeCode}[0]`
        );

        marshal(
          wireFormatWriter,
          type.valueType,
          dictEntry[1],
          `${type.typeCode}[1]`
        );

        return;
      }
    }
  } catch (error) {
    throw new Error(
      `type=${type.typeCode}${typeName ? `=${typeName}` : ''}; ${error.message}`
    );
  }
}
