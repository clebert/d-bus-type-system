import {createBasicType} from '../creators/create-basic-type';
import {BasicType, BasicTypeCode} from '../parse';
import {StringCursor} from '../string-cursor';

export function parseBasicType(
  signatureCursor: StringCursor
): BasicType | undefined {
  const typeCode = signatureCursor.next();

  switch (typeCode) {
    case BasicTypeCode.Uint8:
    case BasicTypeCode.Int16:
    case BasicTypeCode.Uint16:
    case BasicTypeCode.Int32:
    case BasicTypeCode.Uint32:
    case BasicTypeCode.BigInt64:
    case BasicTypeCode.BigUint64:
    case BasicTypeCode.Float64:
    case BasicTypeCode.Boolean:
    case BasicTypeCode.UnixFd:
    case BasicTypeCode.String:
    case BasicTypeCode.ObjectPath:
    case BasicTypeCode.Signature: {
      return createBasicType(typeCode);
    }
  }

  signatureCursor.undo();

  return undefined;
}
