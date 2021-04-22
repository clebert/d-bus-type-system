// @ts-check

const {
  BufferReader,
  BufferWriter,
  arrayType,
  marshal,
  objectPathType,
  stringType,
  structType,
  uint32Type,
  uint8Type,
  unmarshal,
  variantType,
} = require('./lib/cjs');

const wireFormatWriter = new BufferWriter({littleEndian: true});

const type = structType(
  uint8Type,
  uint8Type,
  uint8Type,
  uint8Type,
  uint32Type,
  uint32Type,
  arrayType(structType(uint8Type, variantType))
);

marshal(wireFormatWriter, type, [
  'l'.charCodeAt(0), // endianness
  1, // message type: method call
  0, // flags
  1, // major protocol version
  0, // message body length
  1, // serial
  [
    [1, [objectPathType, '/org/freedesktop/DBus']], // object path
    [2, [stringType, 'org.freedesktop.DBus']], // interface name
    [3, [stringType, 'Hello']], // member name
    [6, [stringType, 'org.freedesktop.DBus']], // destination
  ],
]);

wireFormatWriter.align(8);

const wireFormatReader = new BufferReader(wireFormatWriter.buffer, {
  littleEndian: true,
});

unmarshal(wireFormatReader, type);
