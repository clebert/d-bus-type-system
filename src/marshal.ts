import {BufferWriter} from './buffer-writer';
import {CompleteType, DictEntryType, Predicate, TypeCode, parse} from './parse';
import {isString} from './predicates/is-string';
import {validate} from './validate';

export function marshal<TType extends CompleteType | DictEntryType>(
  wireFormat: BufferWriter,
  type: TType,
  value: unknown
): asserts value is TType['predicate'] extends Predicate<infer TValue>
  ? TValue
  : never;

export function marshal(
  wireFormat: BufferWriter,
  type: CompleteType | DictEntryType,
  value: unknown
): void {
  wireFormat.align(type.bytePadding);

  switch (type.typeCode) {
    case TypeCode.Uint8: {
      wireFormat.writeUint8(validate(type, value));

      return;
    }
    case TypeCode.Int16: {
      wireFormat.writeInt16(validate(type, value));

      return;
    }
    case TypeCode.Uint16: {
      wireFormat.writeUint16(validate(type, value));

      return;
    }
    case TypeCode.Int32: {
      wireFormat.writeInt32(validate(type, value));

      return;
    }
    case TypeCode.Uint32:
    case TypeCode.UnixFD: {
      wireFormat.writeUint32(validate(type, value));

      return;
    }
    case TypeCode.BigInt64: {
      wireFormat.writeBigInt64(validate(type, value));

      return;
    }
    case TypeCode.BigUint64: {
      wireFormat.writeBigUint64(validate(type, value));

      return;
    }
    case TypeCode.Float64: {
      wireFormat.writeFloat64(validate(type, value));

      return;
    }
    case TypeCode.Boolean: {
      wireFormat.writeUint32(validate(type, value) ? 1 : 0);

      return;
    }
    case TypeCode.String:
    case TypeCode.ObjectPath:
    case TypeCode.Signature: {
      const array = new TextEncoder().encode(validate(type, value));

      if (type.typeCode === TypeCode.Signature) {
        wireFormat.writeUint8(array.byteLength);
      } else {
        wireFormat.writeUint32(array.byteLength);
      }

      wireFormat.writeBytes(array.buffer).writeUint8(0);

      return;
    }
    case TypeCode.Array: {
      const elementWireFormat = new BufferWriter({
        littleEndian: wireFormat.littleEndian,
      });

      const elements = validate(type, value);

      for (const element of elements) {
        marshal(elementWireFormat, type.elementType, element);
      }

      wireFormat
        .writeUint32(elementWireFormat.buffer.byteLength)
        .align(type.elementType.bytePadding)
        .writeBytes(elementWireFormat.buffer);

      return;
    }
    case TypeCode.Struct: {
      const fields = validate(type, value);

      if (fields.length < type.fieldTypes.length) {
        throw new Error(
          `type=${type.typeCode}; invalid-number-of-fields=${JSON.stringify(
            fields
          )}; actual=${fields.length}; expected=${type.fieldTypes.length}`
        );
      }

      if (fields.length > type.fieldTypes.length) {
        throw new Error(
          `type=${type.typeCode}; invalid-number-of-fields=${JSON.stringify(
            fields
          )}; actual=${fields.length}; expected=${type.fieldTypes.length}`
        );
      }

      for (let i = 0; i < fields.length; i += 1) {
        marshal(wireFormat, type.fieldTypes[i]!, fields[i]);
      }

      return;
    }
    case TypeCode.Variant: {
      const [variantSignature, variantValue] = validate(type, value);

      marshal(
        wireFormat,
        {typeCode: TypeCode.Signature, bytePadding: 1, predicate: isString},
        variantSignature
      );

      marshal(wireFormat, parse(variantSignature), variantValue);

      return;
    }
    case TypeCode.DictEntry: {
      const dictEntry = validate(type, value);

      marshal(wireFormat, type.keyType, dictEntry[0]);
      marshal(wireFormat, type.valueType, dictEntry[1]);

      return;
    }
  }
}
