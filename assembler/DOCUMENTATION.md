## Documentation
You can see below the API reference of this module.

### `parse(lines)`
Parses provided lines of assembly code.

#### Params
- **Array** `lines`: The input lines.

#### Return
- **Object** An object containing:
 - `lines` (Array): Parsed lines.
 - `addresses` (Object): Parsed labels containing the addresses.
 - `_cAddress` (Number): The current address.
 - `verbose` (String): The verbose parsing output.

### `compileLine(line, parsed)`
Compiles a line.

#### Params
- **Object** `line`: The current line.
- **Object** `parsed`: The object containing the parsed lines.

#### Return
- **String** The machine code generated for the current line.

### `compile(lines)`
Compiles the parsed assembly code.

#### Params
- **String|Array** `lines`: The input lines.

#### Return
- **Object** An object containing:
 - `raw` (Array): An array containing raw output.
 - `mCode` (Array): Generated machine code.

