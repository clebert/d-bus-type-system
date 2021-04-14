// @ts-check

const {
  BufferReader,
  BufferWriter,
  marshal,
  parse,
  unmarshal,
} = require('./lib/cjs');

const wireFormat = new BufferWriter({littleEndian: true});
const type = parse('(yyyyuua(yv))');

marshal(wireFormat, type, [
  'l'.charCodeAt(0), // endianness
  1, // message type: method call
  0, // flags
  1, // major protocol version
  0, // message body length
  1, // serial
  [
    [1, ['o', '/org/freedesktop/DBus']], // path
    [3, ['s', 'Hello']], // member
    [2, ['s', 'org.freedesktop.DBus']], // interface
    [6, ['s', 'org.freedesktop.DBus']], // destination
  ],
]);

wireFormat.align(8);

console.log(wireFormat.buffer);

const value = unmarshal(
  new BufferReader(wireFormat.buffer, {littleEndian: true}),
  type
);

console.log(JSON.stringify(value));
