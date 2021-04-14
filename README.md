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

> A TypeScript implementation of the D-Bus type system with 100% test coverage.

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
  [D-Bus Specification](https://dbus.freedesktop.org/doc/dbus-specification.html).

## Usage example

### Marshal a hello message

```js
import {BufferWriter, marshal, parse} from 'd-bus-type-system';

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
    [2, ['s', 'org.freedesktop.DBus']], // interface
    [3, ['s', 'Hello']], // member
    [6, ['s', 'org.freedesktop.DBus']], // destination
  ],
]);

wireFormat.align(8);

console.log(wireFormat.buffer);
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

const value = unmarshal(
  new BufferReader(wireFormat.buffer, {littleEndian: true}),
  type
);

console.log(JSON.stringify(value));
```

```json
[
  108,
  1,
  0,
  1,
  0,
  1,
  [
    [1, ["o", "/org/freedesktop/DBus"]],
    [3, ["s", "Hello"]],
    [2, ["s", "org.freedesktop.DBus"]],
    [6, ["s", "org.freedesktop.DBus"]]
  ]
]
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
