# D-Bus type system

[![][ci-badge]][ci-link] [![][version-badge]][version-link]
[![][license-badge]][license-link] [![][types-badge]][types-link]

[ci-badge]: https://github.com/clebert/d-bus-type-system/workflows/CI/badge.svg
[ci-link]: https://github.com/clebert/d-bus-type-system
[version-badge]: https://badgen.net/npm/v/d-bus-type-system
[version-link]: https://www.npmjs.com/package/d-bus-type-system
[license-badge]: https://badgen.net/npm/license/d-bus-type-system
[license-link]: https://github.com/clebert/d-bus-type-system/blob/master/LICENSE
[types-badge]: https://badgen.net/npm/types/d-bus-type-system
[types-link]: https://github.com/clebert/d-bus-type-system

> A TypeScript implementation of the D-Bus type system.

## Installation

```
npm install d-bus-type-system
```

## Features

- Designed from the ground up with TypeScript.
- 100% test coverage.
- No npm runtime dependencies.
- Runs in any ES2020 environment. Uses `ArrayBuffer` and `bigint` under the
  hood.
- Accurate implementation of the
  [D-Bus specification](https://dbus.freedesktop.org/doc/dbus-specification.html#type-system).

## Usage example

### Marshal a hello message

```js
import {
  BufferWriter,
  arrayType,
  marshal,
  objectPathType,
  stringType,
  structType,
  uint32Type,
  uint8Type,
  variantType,
} from 'd-bus-type-system';

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

console.log(wireFormatWriter.buffer);
```

```
6c 01 00 01  00 00 00 00  01 00 00 00  6d 00 00 00
01 01 6f 00  15 00 00 00  2f 6f 72 67  2f 66 72 65
65 64 65 73  6b 74 6f 70  2f 44 42 75  73 00 00 00
02 01 73 00  14 00 00 00  6f 72 67 2e  66 72 65 65
64 65 73 6b  74 6f 70 2e  44 42 75 73  00 00 00 00
03 01 73 00  05 00 00 00  48 65 6c 6c  6f 00 00 00
06 01 73 00  14 00 00 00  6f 72 67 2e  66 72 65 65
64 65 73 6b  74 6f 70 2e  44 42 75 73  00 00 00 00
```

### Unmarshal a hello message

```js
import {BufferReader, unmarshal} from 'd-bus-type-system';

const wireFormatReader = new BufferReader(wireFormatWriter.buffer, {
  littleEndian: true,
});

const value = unmarshal(wireFormatReader, type);
```

In Node.js, `TextDecoder` and `TextEncoder` must be made available as global
variables.

```js
import {TextDecoder, TextEncoder} from 'util';

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
```

---

Copyright (c) 2021, Clemens Akens. Released under the terms of the
[MIT License](https://github.com/clebert/d-bus-type-system/blob/master/LICENSE).
