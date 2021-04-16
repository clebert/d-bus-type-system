import {BufferWriter} from './buffer-writer';
import {CompleteType, DictEntryType, Predicate, TypeCode, parse} from './parse';
import {isString} from './predicates/is-string';
import {validate} from './validate';

export function marshal<TType extends CompleteType | DictEntryType>(
  wireFormatWriter: BufferWriter,
  type: TType,
  value: unknown,
  typeName?: string
): asserts value is TType['predicate'] extends Predicate<infer TValue>
  ? TValue
  : never;

export function marshal(
  wireFormatWriter: BufferWriter,
  type: CompleteType | DictEntryType,
  value: unknown,
  typeName: string = ''
): void {
  try {
    wireFormatWriter.align(type.bytePadding);

    switch (type.typeCode) {
      case TypeCode.Uint8: {
        wireFormatWriter.writeUint8(validate(type, value));

        return;
      }
      case TypeCode.Int16: {
        wireFormatWriter.writeInt16(validate(type, value));

        return;
      }
      case TypeCode.Uint16: {
        wireFormatWriter.writeUint16(validate(type, value));

        return;
      }
      case TypeCode.Int32: {
        wireFormatWriter.writeInt32(validate(type, value));

        return;
      }
      case TypeCode.Uint32:
      case TypeCode.UnixFd: {
        wireFormatWriter.writeUint32(validate(type, value));

        return;
      }
      case TypeCode.BigInt64: {
        wireFormatWriter.writeBigInt64(validate(type, value));

        return;
      }
      case TypeCode.BigUint64: {
        wireFormatWriter.writeBigUint64(validate(type, value));

        return;
      }
      case TypeCode.Float64: {
        wireFormatWriter.writeFloat64(validate(type, value));

        return;
      }
      case TypeCode.Boolean: {
        wireFormatWriter.writeUint32(validate(type, value) ? 1 : 0);

        return;
      }
      case TypeCode.String:
      case TypeCode.ObjectPath:
      case TypeCode.Signature: {
        const array = new TextEncoder().encode(validate(type, value));

        if (type.typeCode === TypeCode.Signature) {
          wireFormatWriter.writeUint8(array.byteLength);
        } else {
          wireFormatWriter.writeUint32(array.byteLength);
        }

        wireFormatWriter.writeBytes(array.buffer).writeUint8(0);

        return;
      }
      case TypeCode.Array: {
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
      case TypeCode.Struct: {
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
      case TypeCode.Variant: {
        const [variantSignature, variantValue] = validate(type, value);

        marshal(
          wireFormatWriter,
          {typeCode: TypeCode.Signature, bytePadding: 1, predicate: isString},
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
      case TypeCode.DictEntry: {
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
