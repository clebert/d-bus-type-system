import type {
  BasicType,
  CompleteType,
  ContainerType,
  DictEntryType,
} from './types.js';

import {getErrorMessage} from './get-error-message.js';
import {
  BasicTypeCode,
  ContainerTypeCode,
  arrayType,
  bigInt64Type,
  bigUint64Type,
  booleanType,
  dictEntryType,
  float64Type,
  int16Type,
  int32Type,
  objectPathType,
  signatureType,
  stringType,
  structType,
  uint16Type,
  uint32Type,
  uint8Type,
  unixFdType,
  variantType,
} from './types.js';

export function parseTypes(
  signature: string,
): readonly [CompleteType, ...CompleteType[]] {
  const signatureCursor = new StringCursor(signature);

  try {
    let type = parseCompleteType(signatureCursor);

    if (!type) {
      throw new Error(`expected-complete-type`);
    }

    const types: [CompleteType, ...CompleteType[]] = [type];

    while (true) {
      type = parseCompleteType(signatureCursor);

      if (type) {
        types.push(type);

        continue;
      }

      if (signatureCursor.next()) {
        signatureCursor.undo();

        throw new Error(`expected-complete-type`);
      }

      break;
    }

    return types;
  } catch (error) {
    throw new Error(
      `signature=${JSON.stringify(signature)}; offset=${
        signatureCursor.offset
      }; ${getErrorMessage(error)}`,
    );
  }
}

function parseBasicType(signatureCursor: StringCursor): BasicType | undefined {
  const typeCode = signatureCursor.next();

  switch (typeCode) {
    case BasicTypeCode.Uint8: {
      return uint8Type;
    }
    case BasicTypeCode.Int16: {
      return int16Type;
    }
    case BasicTypeCode.Uint16: {
      return uint16Type;
    }
    case BasicTypeCode.Int32: {
      return int32Type;
    }
    case BasicTypeCode.Uint32: {
      return uint32Type;
    }
    case BasicTypeCode.BigInt64: {
      return bigInt64Type;
    }
    case BasicTypeCode.BigUint64: {
      return bigUint64Type;
    }
    case BasicTypeCode.Float64: {
      return float64Type;
    }
    case BasicTypeCode.Boolean: {
      return booleanType;
    }
    case BasicTypeCode.UnixFd: {
      return unixFdType;
    }
    case BasicTypeCode.String: {
      return stringType;
    }
    case BasicTypeCode.ObjectPath: {
      return objectPathType;
    }
    case BasicTypeCode.Signature: {
      return signatureType;
    }
  }

  signatureCursor.undo();

  return undefined;
}

function parseCompleteType(
  signatureCursor: StringCursor,
): CompleteType | undefined {
  return parseBasicType(signatureCursor) ?? parseContainerType(signatureCursor);
}

function parseContainerType(
  signatureCursor: StringCursor,
): ContainerType | undefined {
  const typeCode = signatureCursor.next();

  switch (typeCode) {
    case ContainerTypeCode.Array: {
      const elementType =
        parseCompleteType(signatureCursor) ??
        parseDictEntryType(signatureCursor);

      if (!elementType) {
        throw new Error(`type=${typeCode}; invalid-element-type`);
      }

      return arrayType(elementType);
    }
    case `(`: {
      const fieldType = parseCompleteType(signatureCursor);

      if (!fieldType) {
        throw new Error(`type=${ContainerTypeCode.Struct}; invalid-field-type`);
      }

      const otherFieldTypes: CompleteType[] = [];

      let otherFieldType: CompleteType | undefined;

      while ((otherFieldType = parseCompleteType(signatureCursor))) {
        otherFieldTypes.push(otherFieldType);
      }

      if (signatureCursor.next() !== `)`) {
        signatureCursor.undo();

        throw new Error(`type=${ContainerTypeCode.Struct}; invalid-field-type`);
      }

      return structType(fieldType, ...otherFieldTypes);
    }
    case ContainerTypeCode.Variant: {
      return variantType;
    }
  }

  signatureCursor.undo();

  return undefined;
}

function parseDictEntryType(
  signatureCursor: StringCursor,
): DictEntryType<any, any> | undefined {
  const typeCode = signatureCursor.next();

  switch (typeCode) {
    case `{`: {
      const keyType = parseBasicType(signatureCursor);

      if (!keyType) {
        throw new Error(
          `type=${ContainerTypeCode.DictEntry}; invalid-key-type`,
        );
      }

      const valueType = parseCompleteType(signatureCursor);

      if (!valueType) {
        throw new Error(
          `type=${ContainerTypeCode.DictEntry}; invalid-value-type`,
        );
      }

      if (signatureCursor.next() !== `}`) {
        signatureCursor.undo();

        throw new Error(`type=${ContainerTypeCode.DictEntry}; unexpected-end`);
      }

      return dictEntryType(keyType, valueType);
    }
  }

  signatureCursor.undo();

  return undefined;
}

class StringCursor {
  readonly #value: string;

  #offset: number = 0;

  constructor(value: string) {
    this.#value = value;
  }

  get offset(): number {
    return this.#offset;
  }

  next(): string | undefined {
    return this.#value[this.#offset++];
  }

  undo(): void {
    this.#offset -= 1;
  }
}
