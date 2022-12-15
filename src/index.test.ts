import {expect, test} from '@jest/globals';
import type {BufferReaderOptions, BufferWriterOptions} from './index.js';
import {
  BufferReader,
  BufferWriter,
  arrayType,
  bigInt64Type,
  bigUint64Type,
  booleanType,
  dictEntryType,
  float64Type,
  int16Type,
  int32Type,
  marshal,
  objectPathType,
  parseTypes,
  serializeType,
  signatureType,
  stringType,
  structType,
  uint16Type,
  uint32Type,
  uint8Type,
  unixFdType,
  unmarshal,
  variantType,
} from './index.js';

test(`marshal values of all types and unmarshal them again`, () => {
  const testCases: readonly [string, 'le' | 'be', 0 | 1, string, unknown][] = [
    [`y`, `le`, 0, `00`, uint8Type.minValue],
    [`y`, `le`, 0, `ff`, uint8Type.maxValue],
    [`y`, `le`, 0, `7f`, 127],
    [`y`, `be`, 0, `7f`, 127],
    [`y`, `le`, 1, `00 ff`, uint8Type.maxValue],

    [`n`, `le`, 0, `00 00`, 0],
    [`n`, `le`, 0, `ff ff`, -1],
    [`n`, `le`, 0, `00 80`, int16Type.minValue],
    [`n`, `le`, 0, `ff 7f`, int16Type.maxValue],
    [`n`, `be`, 0, `ff 7f`, -129],
    [`n`, `le`, 1, `00 00 ff ff`, -1],

    [`q`, `le`, 0, `00 00`, uint16Type.minValue],
    [`q`, `le`, 0, `ff ff`, uint16Type.maxValue],
    [`q`, `le`, 0, `ff 7f`, 32767],
    [`q`, `be`, 0, `ff 7f`, 65407],
    [`q`, `le`, 1, `00 00 ff ff`, uint16Type.maxValue],

    [`i`, `le`, 0, `00 00 00 00`, 0],
    [`i`, `le`, 0, `ff ff ff ff`, -1],
    [`i`, `le`, 0, `00 00 00 80`, int32Type.minValue],
    [`i`, `le`, 0, `ff ff ff 7f`, int32Type.maxValue],
    [`i`, `be`, 0, `ff ff ff 7f`, -129],
    [`i`, `le`, 1, `00 00 00 00 ff ff ff ff`, -1],

    [`u`, `le`, 0, `00 00 00 00`, uint32Type.minValue],
    [`u`, `le`, 0, `ff ff ff ff`, uint32Type.maxValue],
    [`u`, `le`, 0, `ff ff ff 7f`, 2147483647],
    [`u`, `be`, 0, `ff ff ff 7f`, 4294967167],
    [`u`, `le`, 1, `00 00 00 00 ff ff ff ff`, uint32Type.maxValue],

    [`x`, `le`, 0, `00 00 00 00 00 00 00 00`, 0n],
    [`x`, `le`, 0, `ff ff ff ff ff ff ff ff`, -1n],
    [`x`, `le`, 0, `00 00 00 00 00 00 00 80`, bigInt64Type.minValue],
    [`x`, `le`, 0, `ff ff ff ff ff ff ff 7f`, bigInt64Type.maxValue],
    [`x`, `be`, 0, `ff ff ff ff ff ff ff 7f`, -129n],
    [`x`, `le`, 1, `00 00 00 00 00 00 00 00 ff ff ff ff ff ff ff ff`, -1n],

    [`t`, `le`, 0, `00 00 00 00 00 00 00 00`, bigUint64Type.minValue],
    [`t`, `le`, 0, `ff ff ff ff ff ff ff ff`, bigUint64Type.maxValue],
    [`t`, `le`, 0, `ff ff ff ff ff ff ff 7f`, 9223372036854775807n],
    [`t`, `be`, 0, `ff ff ff ff ff ff ff 7f`, 18446744073709551487n],
    [`t`, `le`, 1, `00 00 00 00 00 00 00 00 ff ff ff ff ff ff ff ff`, bigUint64Type.maxValue],

    [`d`, `le`, 0, `00 10 00 00 00 00 00 00`, 2.0237e-320],
    [`d`, `be`, 0, `00 10 00 00 00 00 00 00`, 2.2250738585072014e-308],
    [`d`, `le`, 1, `00 00 00 00 00 00 00 00 00 10 00 00 00 00 00 00`, 2.0237e-320],

    [`b`, `le`, 0, `01 00 00 00`, true],
    [`b`, `le`, 0, `00 00 00 00`, false],
    [`b`, `be`, 0, `00 00 00 01`, true],
    [`b`, `le`, 1, `00 00 00 00 01 00 00 00`, true],

    [`h`, `le`, 0, `00 00 00 00`, uint32Type.minValue],
    [`h`, `le`, 0, `ff ff ff ff`, uint32Type.maxValue],
    [`h`, `le`, 0, `ff ff ff 7f`, 2147483647],
    [`h`, `be`, 0, `ff ff ff 7f`, 4294967167],
    [`h`, `le`, 1, `00 00 00 00 ff ff ff ff`, uint32Type.maxValue],

    [`s`, `le`, 0, `00 00 00 00 00`, ``],
    [`s`, `le`, 0, `03 00 00 00 66 6f 6f 00`, `foo`],
    [`s`, `be`, 0, `00 00 00 03 66 6f 6f 00`, `foo`],
    [`s`, `le`, 1, `00 00 00 00 03 00 00 00 66 6f 6f 00`, `foo`],

    [`o`, `le`, 0, `01 00 00 00 2f 00`, `/`],
    [`o`, `be`, 0, `00 00 00 01 2f 00`, `/`],
    [`o`, `le`, 0, `06 00 00 00 2f 61 5f 42 5f 30 00`, `/a_B_0`],
    [`o`, `le`, 0, `0c 00 00 00 2f 61 5f 42 5f 30 2f 78 5f 5a 5f 39 00`, `/a_B_0/x_Z_9`],
    [`o`, `be`, 1, `00 00 00 00 00 00 00 01 2f 00`, `/`],

    [`g`, `le`, 0, `00 00`, ``],
    [`g`, `le`, 0, `03 66 6f 6f 00`, `foo`],
    [`g`, `be`, 0, `03 66 6f 6f 00`, `foo`],
    [`g`, `le`, 1, `00 03 66 6f 6f 00`, `foo`],

    [`an`, `le`, 0, `00 00 00 00`, []],
    [`an`, `le`, 0, `06 00 00 00 00 00 01 00 02 00`, [0, 1, 2]],
    [`an`, `be`, 0, `00 00 00 06 00 00 00 01 00 02`, [0, 1, 2]],
    [`an`, `le`, 1, `00 00 00 00 00 00 00 00`, []],
    [`an`, `le`, 1, `00 00 00 00 06 00 00 00 00 00 01 00 02 00`, [0, 1, 2]],

    [`a{yn}`, `le`, 0, `00 00 00 00 00 00 00 00`, []],
    [`a{ny}`, `le`, 0, `00 00 00 00 00 00 00 00`, []],
    [`a{yn}`, `le`, 0, `04 00 00 00 00 00 00 00 13 00 55 00`, [[19, 85]]],
    [`a{ny}`, `le`, 0, `03 00 00 00 00 00 00 00 13 00 55`, [[19, 85]]],
    [`a{yn}`, `be`, 0, `00 00 00 04 00 00 00 00 13 00 00 55`, [[19, 85]]],
    [`a{yn}`, `le`, 1, `00 00 00 00 00 00 00 00`, []],
    [`a{yn}`, `le`, 1, `00 00 00 00 04 00 00 00 13 00 55 00`, [[19, 85]]],

    [`(n)`, `le`, 0, `2a 00`, [42]],
    [`(n)`, `be`, 0, `00 2a`, [42]],
    [`(n)`, `le`, 1, `00 00 00 00 00 00 00 00 2a 00`, [42]],

    [`(uuu)`, `le`, 0, `2a 00 00 00 ff ff ff ff c1 07 00 00`, [42, 4294967295, 1985]],
    [`(uuu)`, `be`, 0, `00 00 00 2a ff ff ff ff 00 00 07 c1`, [42, 4294967295, 1985]],
    [`(uuu)`, `le`, 1, `00 00 00 00 00 00 00 00 2a 00 00 00 ff ff ff ff c1 07 00 00`, [42, 4294967295, 1985]],

    [`v`, `le`, 0, `01 79 00 2a`, [uint8Type, 42]],
    [`v`, `le`, 0, `01 6e 00 00 2a 00`, [int16Type, 42]],
    [`v`, `be`, 0, `01 6e 00 00 00 2a`, [int16Type, 42]],
    [`v`, `le`, 1, `00 01 6e 00 2a 00`, [int16Type, 42]],
    [`v`, `le`, 0, `01 71 00 00 2a 00`, [uint16Type, 42]],
    [`v`, `le`, 0, `01 69 00 00 2a 00 00 00`, [int32Type, 42]],
    [`v`, `le`, 0, `01 75 00 00 2a 00 00 00`, [uint32Type, 42]],
    [`v`, `le`, 0, `01 78 00 00 00 00 00 00 2a 00 00 00 00 00 00 00`, [bigInt64Type, 42n]],
    [`v`, `le`, 0, `01 74 00 00 00 00 00 00 2a 00 00 00 00 00 00 00`, [bigUint64Type, 42n]],
    [`v`, `le`, 0, `01 64 00 00 00 00 00 00 00 00 00 00 00 00 45 40`, [float64Type, 42]],
    [`v`, `le`, 0, `01 62 00 00 01 00 00 00`, [booleanType, true]],
    [`v`, `le`, 0, `01 68 00 00 2a 00 00 00`, [unixFdType, 42]],
    [`v`, `le`, 0, `01 73 00 00 03 00 00 00 66 6f 6f 00`, [stringType, `foo`]],
    [`v`, `le`, 0, `01 6f 00 00 01 00 00 00 2f 00`, [objectPathType, `/`]],
    [`v`, `le`, 0, `01 67 00 01 6e 00`, [signatureType, `n`]],
    [`v`, `le`, 0, `02 61 6e 00 02 00 00 00 2a 00`, [arrayType(int16Type), [42]]],
    [`v`, `le`, 0, `03 28 6e 29 00 00 00 00 2a 00`, [structType(int16Type), [42]]],
    [`v`, `le`, 0, `01 76 00 01 6e 00 2a 00`, [variantType, [int16Type, 42]]],
  ];

  for (const [signature, endianness, byteOffset, bytes, value] of testCases) {
    const littleEndian = endianness === `le`;

    let options: (BufferWriterOptions & BufferReaderOptions) | undefined;

    if (littleEndian) {
      options = {...options, littleEndian};
    }

    if (byteOffset) {
      options = {...options, byteOffset};
    }

    const wireFormatWriter = new BufferWriter(options);
    const type = parseTypes(signature)[0];

    expect(serializeType(type)).toBe(signature);
    marshal(wireFormatWriter, type, value);
    expect(toBytes(wireFormatWriter.buffer)).toBe(bytes);

    const wireFormatReader = new BufferReader(wireFormatWriter.buffer, options);

    expect(unmarshal(wireFormatReader, type)).toEqual(value);
  }
});

test(`various unmarshalling errors`, () => {
  const testCases: readonly [string, 'le' | 'be', 0 | 1, string, string][] = [
    [`y`, `le`, 0, ``, `type=y; byte-offset=0; out-of-bounds=1`],
    [`y`, `le`, 1, `00`, `type=y; byte-offset=1; out-of-bounds=1`],

    [`n`, `le`, 0, ``, `type=n; byte-offset=0; out-of-bounds=2`],
    [`n`, `le`, 1, `00`, `type=n; alignment; byte-offset=1; out-of-bounds=1`],
    [`n`, `le`, 1, `00 00`, `type=n; byte-offset=2; out-of-bounds=2`],

    [`q`, `le`, 0, ``, `type=q; byte-offset=0; out-of-bounds=2`],
    [`q`, `le`, 1, `00`, `type=q; alignment; byte-offset=1; out-of-bounds=1`],
    [`q`, `le`, 1, `00 00`, `type=q; byte-offset=2; out-of-bounds=2`],

    [`i`, `le`, 0, ``, `type=i; byte-offset=0; out-of-bounds=4`],
    [`i`, `le`, 1, `00`, `type=i; alignment; byte-offset=1; out-of-bounds=3`],
    [`i`, `le`, 1, `00 00 00 00`, `type=i; byte-offset=4; out-of-bounds=4`],

    [`u`, `le`, 0, ``, `type=u; byte-offset=0; out-of-bounds=4`],
    [`u`, `le`, 1, `00`, `type=u; alignment; byte-offset=1; out-of-bounds=3`],
    [`u`, `le`, 1, `00 00 00 00`, `type=u; byte-offset=4; out-of-bounds=4`],

    [`x`, `le`, 0, ``, `type=x; byte-offset=0; out-of-bounds=8`],
    [`x`, `le`, 1, `00`, `type=x; alignment; byte-offset=1; out-of-bounds=7`],
    [`x`, `le`, 1, `00 00 00 00 00 00 00 00`, `type=x; byte-offset=8; out-of-bounds=8`],

    [`t`, `le`, 0, ``, `type=t; byte-offset=0; out-of-bounds=8`],
    [`t`, `le`, 1, `00`, `type=t; alignment; byte-offset=1; out-of-bounds=7`],
    [`t`, `le`, 1, `00 00 00 00 00 00 00 00`, `type=t; byte-offset=8; out-of-bounds=8`],

    [`d`, `le`, 0, ``, `type=d; byte-offset=0; out-of-bounds=8`],
    [`d`, `le`, 1, `00`, `type=d; alignment; byte-offset=1; out-of-bounds=7`],
    [`d`, `le`, 1, `00 00 00 00 00 00 00 00`, `type=d; byte-offset=8; out-of-bounds=8`],

    [`b`, `le`, 0, `02 00 00 00`, `type=b; byte-offset=0; invalid-value=2`],
    [`b`, `be`, 0, `00 00 00 02`, `type=b; byte-offset=0; invalid-value=2`],
    [`b`, `le`, 1, `00 00 00 00 02 00 00 00`, `type=b; byte-offset=4; invalid-value=2`],
    [`b`, `le`, 0, ``, `type=b; byte-offset=0; out-of-bounds=4`],
    [`b`, `le`, 1, `00`, `type=b; alignment; byte-offset=1; out-of-bounds=3`],
    [`b`, `le`, 1, `00 00 00 00`, `type=b; byte-offset=4; out-of-bounds=4`],

    [`h`, `le`, 0, ``, `type=h; byte-offset=0; out-of-bounds=4`],
    [`h`, `le`, 1, `00`, `type=h; alignment; byte-offset=1; out-of-bounds=3`],
    [`h`, `le`, 1, `00 00 00 00`, `type=h; byte-offset=4; out-of-bounds=4`],

    [`s`, `le`, 0, `02 00 00 00 66 6f 6f 00`, `type=s; byte-offset=6; expected-nul-byte`],
    [`s`, `le`, 0, `04 00 00 00 66 6f 6f 00`, `type=s; byte-offset=7; unexpected-nul-byte`],
    [`s`, `le`, 0, `03 00 00 00 00 6f 6f 00`, `type=s; byte-offset=4; unexpected-nul-byte`],
    [`s`, `le`, 0, `03 00 00 00 66 00 6f 00`, `type=s; byte-offset=5; unexpected-nul-byte`],
    [`s`, `le`, 0, `03 00 00 00 66 6f 00 00`, `type=s; byte-offset=6; unexpected-nul-byte`],
    [`s`, `le`, 0, ``, `type=s; type=u=byte-length; byte-offset=0; out-of-bounds=4`],
    [`s`, `le`, 1, `00`, `type=s; alignment; byte-offset=1; out-of-bounds=3`],
    [`s`, `le`, 1, `00 00 00 00`, `type=s; type=u=byte-length; byte-offset=4; out-of-bounds=4`],

    [`o`, `le`, 0, `00 00 00 00 00`, `type=o; invalid-value=""`],
    [`o`, `le`, 0, `02 00 00 00 2f 2f 00`, `type=o; invalid-value="//"`],
    [`o`, `le`, 0, `07 00 00 00 2f 61 5f 42 5f 30 2f 00`, `type=o; invalid-value="/a_B_0/"`],
    [`o`, `le`, 0, `06 00 00 00 2f 61 2d 42 2d 30 00`, `type=o; invalid-value="/a-B-0"`],

    [`o`, `le`, 0, `02 00 00 00 66 6f 6f 00`, `type=o; byte-offset=6; expected-nul-byte`],
    [`o`, `le`, 0, `04 00 00 00 66 6f 6f 00`, `type=o; byte-offset=7; unexpected-nul-byte`],
    [`o`, `le`, 0, `03 00 00 00 00 6f 6f 00`, `type=o; byte-offset=4; unexpected-nul-byte`],
    [`o`, `le`, 0, `03 00 00 00 66 00 6f 00`, `type=o; byte-offset=5; unexpected-nul-byte`],
    [`o`, `le`, 0, `03 00 00 00 66 6f 00 00`, `type=o; byte-offset=6; unexpected-nul-byte`],
    [`o`, `le`, 0, ``, `type=o; type=u=byte-length; byte-offset=0; out-of-bounds=4`],
    [`o`, `le`, 1, `00`, `type=o; alignment; byte-offset=1; out-of-bounds=3`],
    [`o`, `le`, 1, `00 00 00 00`, `type=o; type=u=byte-length; byte-offset=4; out-of-bounds=4`],

    [`g`, `le`, 0, `02 66 6f 6f 00`, `type=g; byte-offset=3; expected-nul-byte`],
    [`g`, `le`, 0, `04 66 6f 6f 00`, `type=g; byte-offset=4; unexpected-nul-byte`],
    [`g`, `le`, 0, `03 00 6f 6f 00`, `type=g; byte-offset=1; unexpected-nul-byte`],
    [`g`, `le`, 0, `03 66 00 6f 00`, `type=g; byte-offset=2; unexpected-nul-byte`],
    [`g`, `le`, 0, `03 66 6f 00 00`, `type=g; byte-offset=3; unexpected-nul-byte`],
    [`g`, `le`, 0, ``, `type=g; type=y=byte-length; byte-offset=0; out-of-bounds=1`],
    [`g`, `le`, 1, `00`, `type=g; type=y=byte-length; byte-offset=1; out-of-bounds=1`],

    [`an`, `le`, 0, `05 00 00 00 00 00 01 00 02 00`, `type=a; byte-offset=0; invalid-byte-length; actual=6; expected=5`],
    [`an`, `le`, 1, `00 00 00 00 05 00 00 00 00 00 01 00 02 00`, `type=a; byte-offset=4; invalid-byte-length; actual=6; expected=5`],
    [`an`, `le`, 0, `05 00 00 00 00 00 01 00 02`, `type=a; type=n=a[2]; byte-offset=8; out-of-bounds=1`],
    [`an`, `le`, 0, ``, `type=a; type=u=byte-length; byte-offset=0; out-of-bounds=4`],
    [`an`, `le`, 1, `00`, `type=a; alignment; byte-offset=1; out-of-bounds=3`],
    [`an`, `le`, 1, `00 00 00 00`, `type=a; type=u=byte-length; byte-offset=4; out-of-bounds=4`],

    [`a{yn}`, `le`, 0, `04 00 00 00 00 00 00 00`, `type=a; type=e=a[0]; type=y=e[0]; byte-offset=8; out-of-bounds=1`],
    [`a{yn}`, `le`, 0, `04 00 00 00 00 00 00 00 13`, `type=a; type=e=a[0]; type=n=e[1]; alignment; byte-offset=9; out-of-bounds=1`],
    [`a{yn}`, `le`, 0, `04 00 00 00 00 00 00 00 13 00`, `type=a; type=e=a[0]; type=n=e[1]; byte-offset=10; out-of-bounds=2`],
    [`a{yn}`, `le`, 0, `04 00 00 00`, `type=a; type=e=a[0]; alignment; byte-offset=4; out-of-bounds=4`],

    [`(n)`, `le`, 0, ``, `type=r; type=n=r[0]; byte-offset=0; out-of-bounds=2`],
    [`(n)`, `le`, 1, `00`, `type=r; alignment; byte-offset=1; out-of-bounds=7`],
    [`(n)`, `le`, 1, `00 00 00 00 00 00 00 00`, `type=r; type=n=r[0]; byte-offset=8; out-of-bounds=2`],

    [`(uuu)`, `le`, 0, ``, `type=r; type=u=r[0]; byte-offset=0; out-of-bounds=4`],
    [`(uuu)`, `le`, 0, `2a 00 00 00`, `type=r; type=u=r[1]; byte-offset=4; out-of-bounds=4`],
    [`(uuu)`, `le`, 1, `00`, `type=r; alignment; byte-offset=1; out-of-bounds=7`],
    [`(uuu)`, `le`, 1, `00 00 00 00 00 00 00 00`, `type=r; type=u=r[0]; byte-offset=8; out-of-bounds=4`],
    [`(uuu)`, `le`, 1, `00 00 00 00 00 00 00 00 2a 00 00 00`, `type=r; type=u=r[1]; byte-offset=12; out-of-bounds=4`],

    [`v`, `le`, 0, `03 66 6f 6f 00`, `type=v; signature="foo"; offset=0; expected-complete-type`],
    [`v`, `le`, 0, `04 7b 6e 6e 7d 00`, `type=v; signature="{nn}"; offset=0; expected-complete-type`],
    [`v`, `le`, 0, `02 6e 6e 00 13 00`, `type=v; signature="nn"; expected-single-complete-type`],
    [`v`, `le`, 0, ``, `type=v; type=g=v[0]; type=y=byte-length; byte-offset=0; out-of-bounds=1`],
    [`v`, `le`, 0, `01 6e 00`, `type=v; type=n=v[1]; alignment; byte-offset=3; out-of-bounds=1`],
    [`v`, `le`, 1, `00 01 6e 00`, `type=v; type=n=v[1]; byte-offset=4; out-of-bounds=2`],
  ];

  for (const [signature, endianness, byteOffset, bytes, message] of testCases) {
    const wireFormatReader = new BufferReader(toBuffer(bytes), {littleEndian: endianness === `le`, byteOffset});

    expect(() => unmarshal(wireFormatReader, parseTypes(signature)[0])).toThrow(new Error(message));
  }
});

test(`various marshalling errors`, () => {
  const testCases: readonly [string, 'le' | 'be', 0 | 1, unknown, string][] = [
    [`z`, `le`, 0, `foo`, `signature="z"; offset=0; expected-complete-type`],
    [`{yn}`, `le`, 0, [19, 85], `signature="{yn}"; offset=0; expected-complete-type`],

    [`y`, `le`, 0, `foo`, `type=y; invalid-value="foo"`],
    [`y`, `le`, 0, NaN, `type=y; invalid-value=NaN`],
    [`y`, `le`, 0, 0.1, `type=y; invalid-value=0.1`],
    [`y`, `le`, 0, uint8Type.minValue - 1, `type=y; invalid-value=-1`],
    [`y`, `le`, 0, uint8Type.maxValue + 1, `type=y; invalid-value=256`],

    [`n`, `le`, 0, `foo`, `type=n; invalid-value="foo"`],
    [`n`, `le`, 0, NaN, `type=n; invalid-value=NaN`],
    [`n`, `le`, 0, 0.1, `type=n; invalid-value=0.1`],
    [`n`, `le`, 0, int16Type.minValue - 1, `type=n; invalid-value=-32769`],
    [`n`, `le`, 0, int16Type.maxValue + 1, `type=n; invalid-value=32768`],

    [`q`, `le`, 0, `foo`, `type=q; invalid-value="foo"`],
    [`q`, `le`, 0, NaN, `type=q; invalid-value=NaN`],
    [`q`, `le`, 0, 0.1, `type=q; invalid-value=0.1`],
    [`q`, `le`, 0, uint16Type.minValue - 1, `type=q; invalid-value=-1`],
    [`q`, `le`, 0, uint16Type.maxValue + 1, `type=q; invalid-value=65536`],

    [`i`, `le`, 0, `foo`, `type=i; invalid-value="foo"`],
    [`i`, `le`, 0, NaN, `type=i; invalid-value=NaN`],
    [`i`, `le`, 0, 0.1, `type=i; invalid-value=0.1`],
    [`i`, `le`, 0, int32Type.minValue - 1, `type=i; invalid-value=-2147483649`],
    [`i`, `le`, 0, int32Type.maxValue + 1, `type=i; invalid-value=2147483648`],

    [`u`, `le`, 0, `foo`, `type=u; invalid-value="foo"`],
    [`u`, `le`, 0, NaN, `type=u; invalid-value=NaN`],
    [`u`, `le`, 0, 0.1, `type=u; invalid-value=0.1`],
    [`u`, `le`, 0, uint32Type.minValue - 1, `type=u; invalid-value=-1`],
    [`u`, `le`, 0, uint32Type.maxValue + 1, `type=u; invalid-value=4294967296`],

    [`x`, `le`, 0, `foo`, `type=x; invalid-value="foo"`],
    [`x`, `le`, 0, bigInt64Type.minValue - 1n, `type=x; invalid-value=-9223372036854775809`],
    [`x`, `le`, 0, bigInt64Type.maxValue + 1n, `type=x; invalid-value=9223372036854775808`],

    [`t`, `le`, 0, `foo`, `type=t; invalid-value="foo"`],
    [`t`, `le`, 0, bigUint64Type.minValue - 1n, `type=t; invalid-value=-1`],
    [`t`, `le`, 0, bigUint64Type.maxValue + 1n, `type=t; invalid-value=18446744073709551616`],

    [`d`, `le`, 0, `foo`, `type=d; invalid-value="foo"`],
    [`d`, `le`, 0, Infinity, `type=d; invalid-value=Infinity`],
    [`d`, `le`, 0, NaN, `type=d; invalid-value=NaN`],

    [`b`, `le`, 0, `foo`, `type=b; invalid-value="foo"`],

    [`h`, `le`, 0, `foo`, `type=h; invalid-value="foo"`],
    [`h`, `le`, 0, NaN, `type=h; invalid-value=NaN`],
    [`h`, `le`, 0, 0.1, `type=h; invalid-value=0.1`],
    [`h`, `le`, 0, uint32Type.minValue - 1, `type=h; invalid-value=-1`],
    [`h`, `le`, 0, uint32Type.maxValue + 1, `type=h; invalid-value=4294967296`],

    [`s`, `le`, 0, 42, `type=s; invalid-value=42`],

    [`o`, `le`, 0, 42, `type=o; invalid-value=42`],
    [`o`, `le`, 0, ``, `type=o; invalid-value=""`],
    [`o`, `le`, 0, `//`, `type=o; invalid-value="//"`],
    [`o`, `le`, 0, `/a_B_0/`, `type=o; invalid-value="/a_B_0/"`],
    [`o`, `le`, 0, `/a-B-0`, `type=o; invalid-value="/a-B-0"`],

    [`g`, `le`, 0, 42, `type=g; invalid-value=42`],

    [`a`, `le`, 0, [], `signature="a"; offset=1; type=a; invalid-element-type`],
    [`az`, `le`, 0, [], `signature="az"; offset=1; type=a; invalid-element-type`],

    [`ay`, `le`, 0, {}, `type=a; invalid-value={...}`],
    [`ay`, `le`, 0, [`foo`], `type=a; type=y=a[0]; invalid-value="foo"`],

    [`a{`, `le`, 0, [[19, 85]], `signature="a{"; offset=2; type=e; invalid-key-type`],
    [`a{ay`, `le`, 0, [[19, 85]], `signature="a{ay"; offset=2; type=e; invalid-key-type`],
    [`a{v`, `le`, 0, [[19, 85]], `signature="a{v"; offset=2; type=e; invalid-key-type`],
    [`a{y`, `le`, 0, [[19, 85]], `signature="a{y"; offset=3; type=e; invalid-value-type`],
    [`a{yz`, `le`, 0, [[19, 85]], `signature="a{yz"; offset=3; type=e; invalid-value-type`],
    [`a{yn`, `le`, 0, [[19, 85]], `signature="a{yn"; offset=4; type=e; unexpected-end`],
    [`a{ynn`, `le`, 0, [[19, 85]], `signature="a{ynn"; offset=4; type=e; unexpected-end`],

    [`a{yn}`, `le`, 0, [{}], `type=a; type=e=a[0]; invalid-value={...}`],
    [`a{yn}`, `le`, 0, [[]], `type=a; type=e=a[0]; invalid-value=[]`],
    [`a{yn}`, `le`, 0, [[19, 85], [42]], `type=a; type=e=a[1]; invalid-value=[42]`],
    [`a{yn}`, `le`, 0, [[19, 85, `foo`]], `type=a; type=e=a[0]; invalid-value=[19, 85, "foo"]`],
    [`a{yn}`, `le`, 0, [[`foo`, 85]], `type=a; type=e=a[0]; type=y=e[0]; invalid-value="foo"`],
    [`a{yn}`, `le`, 0, [[19, `foo`]], `type=a; type=e=a[0]; type=n=e[1]; invalid-value="foo"`],

    [`(`, `le`, 0, [], `signature="("; offset=1; type=r; invalid-field-type`],
    [`()`, `le`, 0, [], `signature="()"; offset=1; type=r; invalid-field-type`],
    [`(z)`, `le`, 0, [], `signature="(z)"; offset=1; type=r; invalid-field-type`],
    [`(y`, `le`, 0, [], `signature="(y"; offset=2; type=r; invalid-field-type`],
    [`(yz`, `le`, 0, [], `signature="(yz"; offset=2; type=r; invalid-field-type`],
    [`(yzy`, `le`, 0, [], `signature="(yzy"; offset=2; type=r; invalid-field-type`],

    [`(y)`, `le`, 0, [], `type=r; invalid-value=[]`],
    [`(y)`, `le`, 0, [19, 85], `type=r; invalid-length=[19, 85]; actual=2; expected=1`],
    [`(yy)`, `le`, 0, [19], `type=r; invalid-length=[19]; actual=1; expected=2`],
    [`(yy)`, `le`, 0, [`foo`, 85], `type=r; type=y=r[0]; invalid-value="foo"`],
    [`(yy)`, `le`, 0, [19, `foo`], `type=r; type=y=r[1]; invalid-value="foo"`],

    [`v`, `le`, 0, [], `type=v; invalid-value=[]`],
    [`v`, `le`, 0, [`foo`], `type=v; invalid-value=["foo"]`],
    [`v`, `le`, 0, [null, `foo`], `type=v; invalid-value=[null, "foo"]`],
    [`v`, `le`, 0, [undefined, `foo`], `type=v; invalid-value=[undefined, "foo"]`],
    [`v`, `le`, 0, [stringType, `foo`, 42], `type=v; invalid-value=[{...}, "foo", 42]`],
    [`v`, `le`, 0, [dictEntryType(stringType, stringType), 42], `type=v; invalid-value=[{...}, 42]`],
    [`v`, `le`, 0, [stringType, 42], `type=v; type=s; invalid-value=42`],
  ];

  for (const [signature, endianness, byteOffset, value, message] of testCases) {
    const wireFormatWriter = new BufferWriter({littleEndian: endianness === `le`, byteOffset});

    expect(() => marshal(wireFormatWriter, parseTypes(signature)[0], value)).toThrow(new Error(message));
  }
});

test(`parse various types`, () => {
  expect(parseTypes(`oa{sa{sv}}`)).toEqual([
    objectPathType,
    arrayType(dictEntryType(stringType, arrayType(dictEntryType(stringType, variantType)))),
  ]);

  expect(() => parseTypes(``)).toThrow(new Error(`signature=""; offset=0; expected-complete-type`));
  expect(() => parseTypes(`z`)).toThrow(new Error(`signature="z"; offset=0; expected-complete-type`));
  expect(() => parseTypes(`nz`)).toThrow(new Error(`signature="nz"; offset=1; expected-complete-type`));
});

function toBytes(buffer: ArrayBuffer): string {
  return Array.prototype.map.call(new Uint8Array(buffer), (byte) => (`00` + byte.toString(16)).slice(-2)).join(` `);
}

function toBuffer(...bytes: string[]): ArrayBuffer {
  const array: number[] = [];

  for (const byte of bytes.join(` `).split(` `)) {
    if (byte.trim()) {
      array.push(parseInt(byte, 16));
    }
  }

  return new Uint8Array(array).buffer;
}
