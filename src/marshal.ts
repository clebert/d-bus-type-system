import {assert} from './assert';
import {BufferWriter} from './buffer-writer';
import {createBasicType} from './creators/create-basic-type';
import {
  BasicTypeCode,
  CompleteType,
  ContainerTypeCode,
  DictEntryType,
  parseType,
} from './parse-type';

export function marshal(
  wireFormatWriter: BufferWriter,
  type: CompleteType | DictEntryType<any, any>,
  value: unknown
): void {
  try {
    wireFormatWriter.align(type.bytePadding);

    switch (type.typeCode) {
      case BasicTypeCode.Uint8: {
        assert(type, value, true);

        wireFormatWriter.writeUint8(value);

        return;
      }
      case BasicTypeCode.Int16: {
        assert(type, value, true);

        wireFormatWriter.writeInt16(value);

        return;
      }
      case BasicTypeCode.Uint16: {
        assert(type, value, true);

        wireFormatWriter.writeUint16(value);

        return;
      }
      case BasicTypeCode.Int32: {
        assert(type, value, true);

        wireFormatWriter.writeInt32(value);

        return;
      }
      case BasicTypeCode.Uint32:
      case BasicTypeCode.UnixFd: {
        assert(type, value, true);

        wireFormatWriter.writeUint32(value);

        return;
      }
      case BasicTypeCode.BigInt64: {
        assert(type, value, true);

        wireFormatWriter.writeBigInt64(value);

        return;
      }
      case BasicTypeCode.BigUint64: {
        assert(type, value, true);

        wireFormatWriter.writeBigUint64(value);

        return;
      }
      case BasicTypeCode.Float64: {
        assert(type, value, true);

        wireFormatWriter.writeFloat64(value);

        return;
      }
      case BasicTypeCode.Boolean: {
        assert(type, value, true);

        wireFormatWriter.writeUint32(value ? 1 : 0);

        return;
      }
      case BasicTypeCode.String:
      case BasicTypeCode.ObjectPath:
      case BasicTypeCode.Signature: {
        assert(type, value, true);

        const array = new TextEncoder().encode(value);

        if (type.typeCode === BasicTypeCode.Signature) {
          wireFormatWriter.writeUint8(array.byteLength);
        } else {
          wireFormatWriter.writeUint32(array.byteLength);
        }

        wireFormatWriter.writeBytes(array.buffer).writeUint8(0);

        return;
      }
      case ContainerTypeCode.Array: {
        assert(type, value, true);

        const elementWireFormat = new BufferWriter({
          littleEndian: wireFormatWriter.littleEndian,
        });

        for (const element of value) {
          marshal(elementWireFormat, type.elementType, element);
        }

        wireFormatWriter
          .writeUint32(elementWireFormat.buffer.byteLength)
          .align(type.elementType.bytePadding)
          .writeBytes(elementWireFormat.buffer);

        return;
      }
      case ContainerTypeCode.Struct: {
        assert(type, value, true);

        for (let i = 0; i < value.length; i += 1) {
          marshal(wireFormatWriter, type.fieldTypes[i]!, value[i]);
        }

        return;
      }
      case ContainerTypeCode.Variant: {
        assert(type, value, true);

        marshal(
          wireFormatWriter,
          createBasicType(BasicTypeCode.Signature),
          value[0]
        );

        marshal(wireFormatWriter, parseType(value[0]), value[1]);

        return;
      }
      case ContainerTypeCode.DictEntry: {
        assert(type, value, true);
        marshal(wireFormatWriter, type.keyType, value[0]);
        marshal(wireFormatWriter, type.valueType, value[1]);

        return;
      }
    }
  } catch (error) {
    throw error.message.startsWith(`type=${type.typeCode};`)
      ? error
      : new Error(`type=${type.typeCode}; ${error.message}`);
  }
}
