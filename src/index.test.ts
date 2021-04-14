import {TextDecoder, TextEncoder} from 'util';
import {BufferReader, BufferReaderOptions, BufferWriter, BufferWriterOptions, TypeCode, marshal, parse, unmarshal} from '.';

global.TextDecoder = TextDecoder as any;
global.TextEncoder = TextEncoder;

function toBytes(buffer: ArrayBuffer): string {
  return Array.prototype.map.call(new Uint8Array(buffer), (byte) => ('00' + byte.toString(16)).slice(-2)).join(' ');
}

function toBuffer(...bytes: string[]): ArrayBuffer {
  const array: number[] = [];

  for (const byte of bytes.join(' ').split(' ')) {
    if (byte.trim()) {
      array.push(parseInt(byte, 16));
    }
  }

  return new Uint8Array(array).buffer;
}

test('marshal values of all types and unmarshal them again', () => {
  const testCases: readonly [string, 'le' | 'be', 0 | 1, string, unknown][] = [
    [
      '(yyyyuua(yv))',
      'le',
      0,
      toBytes(
        toBuffer(
          '6c 01 00 01 00 00 00 00 01 00 00 00 6d 00 00 00',
          '01 01 6f 00 15 00 00 00 2f 6f 72 67 2f 66 72 65',
          '65 64 65 73 6b 74 6f 70 2f 44 42 75 73 00 00 00',
          '02 01 73 00 14 00 00 00 6f 72 67 2e 66 72 65 65',
          '64 65 73 6b 74 6f 70 2e 44 42 75 73 00 00 00 00',
          '03 01 73 00 05 00 00 00 48 65 6c 6c 6f 00 00 00',
          '06 01 73 00 14 00 00 00 6f 72 67 2e 66 72 65 65',
          '64 65 73 6b 74 6f 70 2e 44 42 75 73 00'
        )
      ),
      [
        'l'.charCodeAt(0), // endianness
        1, // message type: method call
        0, // flags
        1, // major protocol version
        0, // message body length
        1, // serial
        [
          [1, ['o', '/org/freedesktop/DBus']], // path
          [2, ['s', 'org.freedesktop.DBus']], // interface
          [3, ['s', 'Hello']], // member
          [6, ['s', 'org.freedesktop.DBus']], // destination
        ],
      ],
    ],

    ['y', 'le', 0, 'ff', 255],
    ['y', 'le', 0, '7f', 127],
    ['y', 'be', 0, '7f', 127],
    ['y', 'le', 1, '00 ff', 255],

    ['n', 'le', 0, 'ff ff', -1],
    ['n', 'le', 0, 'ff 7f', 32767],
    ['n', 'be', 0, 'ff 7f', -129],
    ['n', 'le', 1, '00 00 ff ff', -1],

    ['q', 'le', 0, 'ff ff', 65535],
    ['q', 'le', 0, 'ff 7f', 32767],
    ['q', 'be', 0, 'ff 7f', 65407],
    ['q', 'le', 1, '00 00 ff ff', 65535],

    ['i', 'le', 0, 'ff ff ff ff', -1],
    ['i', 'le', 0, 'ff ff ff 7f', 2147483647],
    ['i', 'be', 0, 'ff ff ff 7f', -129],
    ['i', 'le', 1, '00 00 00 00 ff ff ff ff', -1],

    ['u', 'le', 0, 'ff ff ff ff', 4294967295],
    ['u', 'le', 0, 'ff ff ff 7f', 2147483647],
    ['u', 'be', 0, 'ff ff ff 7f', 4294967167],
    ['u', 'le', 1, '00 00 00 00 ff ff ff ff', 4294967295],

    ['x', 'le', 0, 'ff ff ff ff ff ff ff ff', -1n],
    ['x', 'le', 0, 'ff ff ff ff ff ff ff 7f', 9223372036854775807n],
    ['x', 'be', 0, 'ff ff ff ff ff ff ff 7f', -129n],
    ['x', 'le', 1, '00 00 00 00 00 00 00 00 ff ff ff ff ff ff ff ff', -1n],

    ['t', 'le', 0, 'ff ff ff ff ff ff ff ff', 18446744073709551615n],
    ['t', 'le', 0, 'ff ff ff ff ff ff ff 7f', 9223372036854775807n],
    ['t', 'be', 0, 'ff ff ff ff ff ff ff 7f', 18446744073709551487n],
    ['t', 'le', 1, '00 00 00 00 00 00 00 00 ff ff ff ff ff ff ff ff', 18446744073709551615n],

    ['d', 'le', 0, '00 10 00 00 00 00 00 00', 2.0237e-320],
    ['d', 'be', 0, '00 10 00 00 00 00 00 00', 2.2250738585072014e-308],
    ['d', 'le', 1, '00 00 00 00 00 00 00 00 00 10 00 00 00 00 00 00', 2.0237e-320],

    ['b', 'le', 0, '01 00 00 00', true],
    ['b', 'le', 0, '00 00 00 00', false],
    ['b', 'be', 0, '00 00 00 01', true],
    ['b', 'le', 1, '00 00 00 00 01 00 00 00', true],

    ['h', 'le', 0, 'ff ff ff ff', 4294967295],
    ['h', 'le', 0, 'ff ff ff 7f', 2147483647],
    ['h', 'be', 0, 'ff ff ff 7f', 4294967167],
    ['h', 'le', 1, '00 00 00 00 ff ff ff ff', 4294967295],

    ['s', 'le', 0, '00 00 00 00 00', ''],
    ['s', 'le', 0, '03 00 00 00 66 6f 6f 00', 'foo'],
    ['s', 'be', 0, '00 00 00 03 66 6f 6f 00', 'foo'],
    ['s', 'le', 1, '00 00 00 00 03 00 00 00 66 6f 6f 00', 'foo'],

    ['o', 'le', 0, '00 00 00 00 00', ''],
    ['o', 'le', 0, '03 00 00 00 66 6f 6f 00', 'foo'],
    ['o', 'be', 0, '00 00 00 03 66 6f 6f 00', 'foo'],
    ['o', 'le', 1, '00 00 00 00 03 00 00 00 66 6f 6f 00', 'foo'],

    ['g', 'le', 0, '00 00', ''],
    ['g', 'le', 0, '03 66 6f 6f 00', 'foo'],
    ['g', 'be', 0, '03 66 6f 6f 00', 'foo'],
    ['g', 'le', 1, '00 03 66 6f 6f 00', 'foo'],

    ['an', 'le', 0, '00 00 00 00', []],
    ['an', 'le', 0, '06 00 00 00 00 00 01 00 02 00', [0, 1, 2]],
    ['an', 'be', 0, '00 00 00 06 00 00 00 01 00 02', [0, 1, 2]],
    ['an', 'le', 1, '00 00 00 00 00 00 00 00', []],
    ['an', 'le', 1, '00 00 00 00 06 00 00 00 00 00 01 00 02 00', [0, 1, 2]],

    ['a{yn}', 'le', 0, '00 00 00 00 00 00 00 00', []],
    ['a{ny}', 'le', 0, '00 00 00 00 00 00 00 00', []],
    ['a{yn}', 'le', 0, '04 00 00 00 00 00 00 00 13 00 55 00', [[19, 85]]],
    ['a{ny}', 'le', 0, '03 00 00 00 00 00 00 00 13 00 55', [[19, 85]]],
    ['a{yn}', 'be', 0, '00 00 00 04 00 00 00 00 13 00 00 55', [[19, 85]]],
    ['a{yn}', 'le', 1, '00 00 00 00 00 00 00 00', []],
    ['a{yn}', 'le', 1, '00 00 00 00 04 00 00 00 13 00 55 00', [[19, 85]]],

    ['(n)', 'le', 0, '2a 00', [42]],
    ['(n)', 'be', 0, '00 2a', [42]],
    ['(n)', 'le', 1, '00 00 00 00 00 00 00 00 2a 00', [42]],

    ['(uuu)', 'le', 0, '2a 00 00 00 ff ff ff ff c1 07 00 00', [42, 4294967295, 1985]],
    ['(uuu)', 'be', 0, '00 00 00 2a ff ff ff ff 00 00 07 c1', [42, 4294967295, 1985]],
    ['(uuu)', 'le', 1, '00 00 00 00 00 00 00 00 2a 00 00 00 ff ff ff ff c1 07 00 00', [42, 4294967295, 1985]],

    ['v', 'le', 0, '01 6e 00 00 2a 00', [TypeCode.Int16, 42]],
    ['v', 'be', 0, '01 6e 00 00 00 2a', [TypeCode.Int16, 42]],
    ['v', 'le', 1, '00 01 6e 00 2a 00', [TypeCode.Int16, 42]],
  ];

  for (const [signature, endianness, byteOffset, bytes, value] of testCases) {
    const littleEndian = endianness === 'le';

    let options: (BufferWriterOptions & BufferReaderOptions) | undefined;

    if (littleEndian) {
      options = {...options, littleEndian};
    }

    if (byteOffset) {
      options = {...options, byteOffset};
    }

    const wireFormat = new BufferWriter(options);

    marshal(wireFormat, parse(signature), value);

    expect(toBytes(wireFormat.buffer)).toBe(bytes);
    expect(unmarshal(new BufferReader(wireFormat.buffer, options), parse(signature))).toEqual(value);
  }
});

test('various unmarshalling errors', () => {
  const testCases: readonly [string, 'le' | 'be', 0 | 1, string, string][] = [
    ['y', 'le', 0, '', 'type=y; byte-offset=0; out-of-bounds=1'],
    ['y', 'le', 1, '00', 'type=y; byte-offset=1; out-of-bounds=1'],

    ['n', 'le', 0, '', 'type=n; byte-offset=0; out-of-bounds=2'],
    ['n', 'le', 1, '00', 'type=n; alignment; byte-offset=1; out-of-bounds=1'],
    ['n', 'le', 1, '00 00', 'type=n; byte-offset=2; out-of-bounds=2'],

    ['q', 'le', 0, '', 'type=q; byte-offset=0; out-of-bounds=2'],
    ['q', 'le', 1, '00', 'type=q; alignment; byte-offset=1; out-of-bounds=1'],
    ['q', 'le', 1, '00 00', 'type=q; byte-offset=2; out-of-bounds=2'],

    ['i', 'le', 0, '', 'type=i; byte-offset=0; out-of-bounds=4'],
    ['i', 'le', 1, '00', 'type=i; alignment; byte-offset=1; out-of-bounds=3'],
    ['i', 'le', 1, '00 00 00 00', 'type=i; byte-offset=4; out-of-bounds=4'],

    ['u', 'le', 0, '', 'type=u; byte-offset=0; out-of-bounds=4'],
    ['u', 'le', 1, '00', 'type=u; alignment; byte-offset=1; out-of-bounds=3'],
    ['u', 'le', 1, '00 00 00 00', 'type=u; byte-offset=4; out-of-bounds=4'],

    ['x', 'le', 0, '', 'type=x; byte-offset=0; out-of-bounds=8'],
    ['x', 'le', 1, '00', 'type=x; alignment; byte-offset=1; out-of-bounds=7'],
    ['x', 'le', 1, '00 00 00 00 00 00 00 00', 'type=x; byte-offset=8; out-of-bounds=8'],

    ['t', 'le', 0, '', 'type=t; byte-offset=0; out-of-bounds=8'],
    ['t', 'le', 1, '00', 'type=t; alignment; byte-offset=1; out-of-bounds=7'],
    ['t', 'le', 1, '00 00 00 00 00 00 00 00', 'type=t; byte-offset=8; out-of-bounds=8'],

    ['d', 'le', 0, '', 'type=d; byte-offset=0; out-of-bounds=8'],
    ['d', 'le', 1, '00', 'type=d; alignment; byte-offset=1; out-of-bounds=7'],
    ['d', 'le', 1, '00 00 00 00 00 00 00 00', 'type=d; byte-offset=8; out-of-bounds=8'],

    ['b', 'le', 0, '02 00 00 00', 'type=b; byte-offset=0; invalid-value=2'],
    ['b', 'be', 0, '00 00 00 02', 'type=b; byte-offset=0; invalid-value=2'],
    ['b', 'le', 1, '00 00 00 00 02 00 00 00', 'type=b; byte-offset=4; invalid-value=2'],
    ['b', 'le', 0, '', 'type=b; byte-offset=0; out-of-bounds=4'],
    ['b', 'le', 1, '00', 'type=b; alignment; byte-offset=1; out-of-bounds=3'],
    ['b', 'le', 1, '00 00 00 00', 'type=b; byte-offset=4; out-of-bounds=4'],

    ['h', 'le', 0, '', 'type=h; byte-offset=0; out-of-bounds=4'],
    ['h', 'le', 1, '00', 'type=h; alignment; byte-offset=1; out-of-bounds=3'],
    ['h', 'le', 1, '00 00 00 00', 'type=h; byte-offset=4; out-of-bounds=4'],

    ['s', 'le', 0, '02 00 00 00 66 6f 6f 00', 'type=s; byte-offset=6; expected-nul-byte'],
    ['s', 'le', 0, '04 00 00 00 66 6f 6f 00', 'type=s; byte-offset=7; unexpected-nul-byte'],
    ['s', 'le', 0, '03 00 00 00 00 6f 6f 00', 'type=s; byte-offset=4; unexpected-nul-byte'],
    ['s', 'le', 0, '03 00 00 00 66 00 6f 00', 'type=s; byte-offset=5; unexpected-nul-byte'],
    ['s', 'le', 0, '03 00 00 00 66 6f 00 00', 'type=s; byte-offset=6; unexpected-nul-byte'],
    ['s', 'le', 0, '', 'type=s; type=u=byte-length; byte-offset=0; out-of-bounds=4'],
    ['s', 'le', 1, '00', 'type=s; alignment; byte-offset=1; out-of-bounds=3'],
    ['s', 'le', 1, '00 00 00 00', 'type=s; type=u=byte-length; byte-offset=4; out-of-bounds=4'],

    ['o', 'le', 0, '02 00 00 00 66 6f 6f 00', 'type=o; byte-offset=6; expected-nul-byte'],
    ['o', 'le', 0, '04 00 00 00 66 6f 6f 00', 'type=o; byte-offset=7; unexpected-nul-byte'],
    ['o', 'le', 0, '03 00 00 00 00 6f 6f 00', 'type=o; byte-offset=4; unexpected-nul-byte'],
    ['o', 'le', 0, '03 00 00 00 66 00 6f 00', 'type=o; byte-offset=5; unexpected-nul-byte'],
    ['o', 'le', 0, '03 00 00 00 66 6f 00 00', 'type=o; byte-offset=6; unexpected-nul-byte'],
    ['o', 'le', 0, '', 'type=o; type=u=byte-length; byte-offset=0; out-of-bounds=4'],
    ['o', 'le', 1, '00', 'type=o; alignment; byte-offset=1; out-of-bounds=3'],
    ['o', 'le', 1, '00 00 00 00', 'type=o; type=u=byte-length; byte-offset=4; out-of-bounds=4'],

    ['g', 'le', 0, '02 66 6f 6f 00', 'type=g; byte-offset=3; expected-nul-byte'],
    ['g', 'le', 0, '04 66 6f 6f 00', 'type=g; byte-offset=4; unexpected-nul-byte'],
    ['g', 'le', 0, '03 00 6f 6f 00', 'type=g; byte-offset=1; unexpected-nul-byte'],
    ['g', 'le', 0, '03 66 00 6f 00', 'type=g; byte-offset=2; unexpected-nul-byte'],
    ['g', 'le', 0, '03 66 6f 00 00', 'type=g; byte-offset=3; unexpected-nul-byte'],
    ['g', 'le', 0, '', 'type=g; type=y=byte-length; byte-offset=0; out-of-bounds=1'],
    ['g', 'le', 1, '00', 'type=g; type=y=byte-length; byte-offset=1; out-of-bounds=1'],

    ['an', 'le', 0, '05 00 00 00 00 00 01 00 02 00', 'type=a; byte-offset=0; invalid-byte-length; actual=6; expected=5'],
    ['an', 'le', 1, '00 00 00 00 05 00 00 00 00 00 01 00 02 00', 'type=a; byte-offset=4; invalid-byte-length; actual=6; expected=5'],
    ['an', 'le', 0, '05 00 00 00 00 00 01 00 02', 'type=a; type=n=element[2]; byte-offset=8; out-of-bounds=1'],
    ['an', 'le', 0, '', 'type=a; type=u=byte-length; byte-offset=0; out-of-bounds=4'],
    ['an', 'le', 1, '00', 'type=a; alignment; byte-offset=1; out-of-bounds=3'],
    ['an', 'le', 1, '00 00 00 00', 'type=a; type=u=byte-length; byte-offset=4; out-of-bounds=4'],

    ['a{yn}', 'le', 0, '04 00 00 00 00 00 00 00', 'type=a; type=e=element[0]; type=y=key; byte-offset=8; out-of-bounds=1'],
    ['a{yn}', 'le', 0, '04 00 00 00 00 00 00 00 13', 'type=a; type=e=element[0]; type=n=value; alignment; byte-offset=9; out-of-bounds=1'],
    ['a{yn}', 'le', 0, '04 00 00 00 00 00 00 00 13 00', 'type=a; type=e=element[0]; type=n=value; byte-offset=10; out-of-bounds=2'],
    ['a{yn}', 'le', 0, '04 00 00 00', 'type=a; type=e=element[0]; alignment; byte-offset=4; out-of-bounds=4'],

    ['(n)', 'le', 0, '', 'type=r; type=n=field[0]; byte-offset=0; out-of-bounds=2'],
    ['(n)', 'le', 1, '00', 'type=r; alignment; byte-offset=1; out-of-bounds=7'],
    ['(n)', 'le', 1, '00 00 00 00 00 00 00 00', 'type=r; type=n=field[0]; byte-offset=8; out-of-bounds=2'],

    ['(uuu)', 'le', 0, '', 'type=r; type=u=field[0]; byte-offset=0; out-of-bounds=4'],
    ['(uuu)', 'le', 0, '2a 00 00 00', 'type=r; type=u=field[1]; byte-offset=4; out-of-bounds=4'],
    ['(uuu)', 'le', 1, '00', 'type=r; alignment; byte-offset=1; out-of-bounds=7'],
    ['(uuu)', 'le', 1, '00 00 00 00 00 00 00 00', 'type=r; type=u=field[0]; byte-offset=8; out-of-bounds=4'],
    ['(uuu)', 'le', 1, '00 00 00 00 00 00 00 00 2a 00 00 00', 'type=r; type=u=field[1]; byte-offset=12; out-of-bounds=4'],

    ['v', 'le', 0, '', 'type=v; type=g=signature; type=y=byte-length; byte-offset=0; out-of-bounds=1'],
    ['v', 'le', 0, '01 6e 00', 'type=v; type=n=value; alignment; byte-offset=3; out-of-bounds=1'],
    ['v', 'le', 1, '00 01 6e 00', 'type=v; type=n=value; byte-offset=4; out-of-bounds=2'],
  ];

  for (const [signature, endianness, byteOffset, bytes, message] of testCases) {
    const wireFormat = new BufferReader(toBuffer(bytes), {littleEndian: endianness === 'le', byteOffset});

    expect(() => unmarshal(wireFormat, parse(signature))).toThrow(new Error(message));
  }
});

test('various marshalling errors', () => {
  const testCases: readonly [string, 'le' | 'be', 0 | 1, unknown, string][] = [
    ['y', 'le', 0, 'foo', 'type=y; invalid-value="foo"'],
    ['n', 'le', 0, 'foo', 'type=n; invalid-value="foo"'],
    ['q', 'le', 0, 'foo', 'type=q; invalid-value="foo"'],
    ['i', 'le', 0, 'foo', 'type=i; invalid-value="foo"'],
    ['u', 'le', 0, 'foo', 'type=u; invalid-value="foo"'],
    ['x', 'le', 0, 'foo', 'type=x; invalid-value="foo"'],
    ['t', 'le', 0, 'foo', 'type=t; invalid-value="foo"'],
    ['d', 'le', 0, 'foo', 'type=d; invalid-value="foo"'],
    ['b', 'le', 0, 'foo', 'type=b; invalid-value="foo"'],
    ['h', 'le', 0, 'foo', 'type=h; invalid-value="foo"'],
    ['s', 'le', 0, 42, 'type=s; invalid-value=42'],
    ['o', 'le', 0, 42, 'type=o; invalid-value=42'],
    ['g', 'le', 0, 42, 'type=g; invalid-value=42'],

    ['a', 'le', 0, [], 'type=a; invalid-element-type'],
    ['az', 'le', 0, [], 'type=a; invalid-element-type'],
    ['ay', 'le', 0, {}, 'type=a; invalid-value={}'],
    ['ay', 'le', 0, ['foo'], 'type=y; invalid-value="foo"'],
    ['a{yn}', 'le', 0, [{}], 'type=e; invalid-value={}'],
    ['a{yn}', 'le', 0, [[]], 'type=e; invalid-value=[]'],
    ['a{yn}', 'le', 0, [[19]], 'type=e; invalid-value=[19]'],
    ['a{yn}', 'le', 0, [[19, 85, 'foo']], 'type=e; invalid-value=[19,85,"foo"]'],
    ['a{yn}', 'le', 0, [['foo', 85]], 'type=y; invalid-value="foo"'],
    ['a{yn}', 'le', 0, [[19, 'foo']], 'type=n; invalid-value="foo"'],
    ['a{', 'le', 0, [[19, 85]], 'type=e; invalid-key-type'],
    ['a{ay', 'le', 0, [[19, 85]], 'type=e; invalid-key-type'],
    ['a{v', 'le', 0, [[19, 85]], 'type=e; invalid-key-type'],
    ['a{y', 'le', 0, [[19, 85]], 'type=e; invalid-value-type'],
    ['a{yz', 'le', 0, [[19, 85]], 'type=e; invalid-value-type'],
    ['a{yn', 'le', 0, [[19, 85]], 'type=e; unexpected-end'],
    ['a{ynn', 'le', 0, [[19, 85]], 'type=e; unexpected-end'],

    ['(', 'le', 0, [], 'type=r; invalid-field-type'],
    ['()', 'le', 0, [], 'type=r; invalid-field-type'],
    ['(z)', 'le', 0, [], 'type=r; invalid-field-type'],
    ['(y', 'le', 0, [], 'type=r; invalid-field-type'],
    ['(yz', 'le', 0, [], 'type=r; invalid-field-type'],
    ['(yzy', 'le', 0, [], 'type=r; invalid-field-type'],
    ['(y)', 'le', 0, [], 'type=r; invalid-value=[]'],
    ['(y)', 'le', 0, [19, 85], 'type=r; invalid-number-of-fields=[19,85]; actual=2; expected=1'],
    ['(yy)', 'le', 0, [19], 'type=r; invalid-number-of-fields=[19]; actual=1; expected=2'],

    ['v', 'le', 0, [], 'type=v; invalid-value=[]'],
    ['v', 'le', 0, ['foo'], 'type=v; invalid-value=["foo"]'],
    ['v', 'le', 0, [19, 85], 'type=v; invalid-value=[19,85]'],
    ['v', 'le', 0, ['foo', 19, 85], 'type=v; invalid-value=["foo",19,85]'],
    ['v', 'le', 0, ['foo', 42], 'invalid-signature="foo"'],
    ['v', 'le', 0, ['s', 42], 'type=s; invalid-value=42'],
  ];

  for (const [signature, endianness, byteOffset, value, message] of testCases) {
    expect(() => marshal(new BufferWriter({littleEndian: endianness === 'le', byteOffset}), parse(signature), value)).toThrow(
      new Error(message)
    );
  }
});
