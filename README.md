# snapdragon-util [![NPM version](https://img.shields.io/npm/v/snapdragon-util.svg?style=flat)](https://www.npmjs.com/package/snapdragon-util) [![NPM monthly downloads](https://img.shields.io/npm/dm/snapdragon-util.svg?style=flat)](https://npmjs.org/package/snapdragon-util)  [![NPM total downloads](https://img.shields.io/npm/dt/snapdragon-util.svg?style=flat)](https://npmjs.org/package/snapdragon-util) [![Linux Build Status](https://img.shields.io/travis/jonschlinkert/snapdragon-util.svg?style=flat&label=Travis)](https://travis-ci.org/jonschlinkert/snapdragon-util)

> Utilities for the snapdragon parser/compiler.

<details>
<summary><strong>Table of Contents</strong></summary>
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [About](#about)
</details>

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save snapdragon-util
```

## Usage

```js
var util = require('snapdragon-util');
```

## API

### [.isNode](index.js#L17)

Returns true if the given value is a node.

**Params**

* `node` **{Object}**

**Example**

```js
var node = snapdragon.parser.node({type: 'foo'});
console.log(utils.isNode(node)); //=> true
console.log(utils.isNode({})); //=> false
```

### [.noop](index.js#L32)

Emit an empty string for the given `node`.

**Params**

* `node` **{Object}**

**Example**

```js
// do nothing for beginning-of-string
snapdragon.compiler.set('bos', utils.noop);
```

### [.emit](index.js#L52)

Emit `val` for the given node. Useful when you know what needs to be emitted in advance and you don't need to access the actual node.

**Params**

* `node` **{Object}**

**Example**

```js
snapdragon.compiler
  .set('i', function(node) {
    this.mapVisit(node);
  })
  .set('i.open', utils.emit('<i>'))
  .set('i.close', utils.emit('</i>'))
```

### [.toNoop](index.js#L70)

Converts an AST node into an empty `text` node and deletes `node.nodes`.

**Params**

* `node` **{Object}**

**Example**

```js
utils.toNoop(node);
// convert `node.nodes` to the given value instead of deleting it
utils.toNoop(node, []);
```

### [.visit](index.js#L100)

Visit `node` with the given `fn`. The built-in `.visit` method in snapdragon automatically calls registered compilers, this allows you to pass a visitor function.

**Params**

* `node` **{Object}**
* `options` **{Object}**: Set `options.recurse` to true call recursively call `mapVisit` on `node.nodes`.
* `fn` **{Function}**
* `returns` **{Object}**: returns the node

**Example**

```js
snapdragon.compiler.set('i', function(node) {
  utils.visit(node, function(node2) {
    // do stuff with "node2"
    return node2;
  });
});
```

### [.mapVisit](index.js#L139)

Map [visit](#visit) with the given `fn` over an array of AST `nodes`.

**Params**

* `node` **{Object}**
* `options` **{Object}**
* `fn` **{Function}**
* `returns` **{Object}**: returns the node

**Example**

```js
snapdragon.compiler.set('i', function(node) {
  utils.mapVisit(node, function(node2) {
    // do stuff with "node2"
    return node2;
  });
});
```

### [.wrapNodes](index.js#L165)

Wraps the given `node` with `*.open` and `*.close` nodes.

**Params**

* `node` **{Object}**: (required)
* `Node` **{Function}**: (required) Node constructor function from [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node).
* `filter` **{Function}**: Optionaly specify a filter function to exclude the node.
* `returns` **{undefined}**

### [.addOpen](index.js#L180)

Unshift an `*.open` node onto `node.nodes`.

**Params**

* `node` **{Object}**
* `Node` **{Function}**: (required) Node constructor function from [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node).
* `filter` **{Function}**: Optionaly specify a filter function to exclude the node.
* `returns` **{undefined}**

### [.addClose](index.js#L200)

Push a `*.close` node onto `node.nodes`.

**Params**

* `node` **{Object}**
* `Node` **{Function}**: (required) Node constructor function from [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node).
* `filter` **{Function}**: Optionaly specify a filter function to exclude the node.
* `returns` **{undefined}**

### [.pushNode](index.js#L226)

Push the given `node` onto `parent.nodes`, and set `parent` as `node.parent.

**Params**

* `parent` **{Object}**
* `node` **{Object}**
* `returns` **{undefined}**

**Example**

```js
var parent = new Node({type: 'foo'});
var node = new Node({type: 'bar'});
utils.pushNode(parent, node);
console.log(parent.nodes[0].type) // 'bar'
console.log(node.parent.type) // 'foo'
```

### [.unshiftNode](index.js#L248)

Unshift `node` onto `parent.nodes`, and set `parent` as `node.parent.

**Params**

* `parent` **{Object}**
* `node` **{Object}**
* `returns` **{undefined}**

**Example**

```js
var parent = new Node({type: 'foo'});
var node = new Node({type: 'bar'});
utils.unshiftNode(parent, node);
console.log(parent.nodes[0].type) // 'bar'
console.log(node.parent.type) // 'foo'
```

### [.isType](index.js#L270)

Returns true if `node` is a valid [Node](https://github.com/jonschlinkert/snapdragon-node) and `node.type` matches the given `type`.

**Params**

* `node` **{Object}**
* `type` **{String}**
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var node = new Node({type: 'foo'});
console.log(utils.isType(node, 'foo')); // false
console.log(utils.isType(node, 'bar')); // true
```

### [.hasType](index.js#L314)

Returns true if the given `node` has the given `type` in `node.nodes`.

**Params**

* `node` **{Object}**
* `type` **{String}**
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var node = new Node({
  type: 'foo',
  nodes: [
    new Node({type: 'bar'}),
    new Node({type: 'baz'})
  ]
});
console.log(utils.hasType(node, 'xyz')); // false
console.log(utils.hasType(node, 'baz')); // true
```

### [.firstOfType](index.js#L346)

Returns the first node from `node.nodes` of the given `type`

**Params**

* `nodes` **{Array}**
* `type` **{String}**
* `returns` **{Object|undefined}**: Returns the first matching node or undefined.

**Example**

```js
var node = new Node({
  type: 'foo',
  nodes: [
    new Node({type: 'text', val: 'abc'}),
    new Node({type: 'text', val: 'xyz'})
  ]
});

var textNode = utils.firstOfType(node.nodes, 'text');
console.log(textNode.val);
//=> 'abc'
```

### [.getNode](index.js#L387)

Returns the node at the specified index, or the first node of the given `type` from `node.nodes`.

**Params**

* `nodes` **{Array}**
* `type` **{String|Number}**: Node type or index.
* `returns` **{Object}**: Returns a node or undefined.

**Example**

```js
var node = new Node({
  type: 'foo',
  nodes: [
    new Node({type: 'text', val: 'abc'}),
    new Node({type: 'text', val: 'xyz'})
  ]
});

var nodeOne = utils.getNode(node.nodes, 'text');
console.log(nodeOne.val);
//=> 'abc'

var nodeTwo = utils.getNode(node.nodes, 1);
console.log(nodeTwo.val);
//=> 'xyz'
```

### [.isOpen](index.js#L413)

Returns true if the given node is an "*.open" node.

**Params**

* `node` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var brace = new Node({type: 'brace'});
var open = new Node({type: 'brace.open'});
var close = new Node({type: 'brace.close'});

console.log(utils.isOpen(brace)); // false
console.log(utils.isOpen(open)); // true
console.log(utils.isOpen(close)); // false
```

### [.isClose](index.js#L438)

Returns true if the given node is a "*.close" node.

**Params**

* `node` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var brace = new Node({type: 'brace'});
var open = new Node({type: 'brace.open'});
var close = new Node({type: 'brace.close'});

console.log(utils.isClose(brace)); // false
console.log(utils.isClose(open)); // false
console.log(utils.isClose(close)); // true
```

### [.hasOpen](index.js#L466)

Returns true if `node.nodes` **has** an `.open` node

**Params**

* `node` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var brace = new Node({
  type: 'brace',
  nodes: []
});

var open = new Node({type: 'brace.open'});
console.log(utils.hasOpen(brace)); // false

brace.addNode(open);
console.log(utils.hasOpen(brace)); // true
```

### [.hasClose](index.js#L494)

Returns true if `node.nodes` **has** a `.close` node

**Params**

* `node` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var brace = new Node({
  type: 'brace',
  nodes: []
});

var close = new Node({type: 'brace.close'});
console.log(utils.hasClose(brace)); // false

brace.addNode(close);
console.log(utils.hasClose(brace)); // true
```

### [.hasOpenAndClose](index.js#L526)

Returns true if `node.nodes` has both `.open` and `.close` nodes

**Params**

* `node` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var brace = new Node({
  type: 'brace',
  nodes: []
});

var open = new Node({type: 'brace.open'});
var close = new Node({type: 'brace.close'});
console.log(utils.hasOpen(brace)); // false
console.log(utils.hasClose(brace)); // false

brace.addNode(open);
brace.addNode(close);
console.log(utils.hasOpen(brace)); // true
console.log(utils.hasClose(brace)); // true
```

### [.addType](index.js#L540)

Push the given `node` onto the `state.inside` array for the
given type. This array is used as a "stack" for the given `node.type`.

**Params**

* `state` **{Object}**: The `compiler.state` object or custom state object.
* `node` **{Object}**
* `returns` **{undefined}**

### [.last](index.js#L664)

Get the last `n` element from the given `array`. Used for getting
a node from `node.nodes.`

**Params**

* `array` **{Array}**
* `n` **{Number}**
* `returns` **{undefined}**

### [.arrayify](index.js#L684)

Cast the given `val` to an array.

**Params**

* `val` **{any}**
* `returns` **{Array}**

**Example**

```js
console.log(utils.arraify(''));
//=> []
console.log(utils.arraify('foo'));
//=> ['foo']
console.log(utils.arraify(['foo']));
//=> ['foo']
```

### [.stringify](index.js#L697)

Convert the given `val` to a string by joining with `,`. Useful
for creating a cheerio/CSS/DOM-style selector from a list of strings.

**Params**

* `val` **{any}**
* `returns` **{Array}**

## About

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](.github/contributing.md) for advice on opening issues, pull requests, and coding standards.

### Building docs

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

### Running tests

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

### Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](https://twitter.com/jonschlinkert)

### License

Copyright © 2017, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.4.3, on March 04, 2017._