# snapdragon-util [![NPM version](https://img.shields.io/npm/v/snapdragon-util.svg?style=flat)](https://www.npmjs.com/package/snapdragon-util) [![NPM monthly downloads](https://img.shields.io/npm/dm/snapdragon-util.svg?style=flat)](https://npmjs.org/package/snapdragon-util) [![NPM total downloads](https://img.shields.io/npm/dt/snapdragon-util.svg?style=flat)](https://npmjs.org/package/snapdragon-util) [![Linux Build Status](https://img.shields.io/travis/here-be/snapdragon-util.svg?style=flat&label=Travis)](https://travis-ci.org/here-be/snapdragon-util)

> Utilities for the snapdragon parser/compiler.

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

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

### [.isNode](index.js#L20)

Returns true if the given value is a node.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var node = new Node({type: 'foo'});
console.log(utils.isNode(node)); //=> true
console.log(utils.isNode({})); //=> false
```

### [.noop](index.js#L36)

Emit an empty string for the given `node`.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{undefined}**

**Example**

```js
// do nothing for beginning-of-string
snapdragon.compiler.set('bos', utils.noop);
```

### [.value](index.js#L54)

Returns `node.value` or `node.val`.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{String}**: returns

**Example**

```js
const star = new Node({type: 'star', value: '*'});
const slash = new Node({type: 'slash', val: '/'});
console.log(utils.value(star)) //=> '*'
console.log(utils.value(slash)) //=> '/'
```

### [.identity](index.js#L72)

Append `node.value` to `compiler.output`.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{undefined}**

**Example**

```js
snapdragon.compiler.set('text', utils.identity);
```

### [.append](index.js#L95)

Previously named `.emit`, this method appends the given `value` to `compiler.output` for the given node. Useful when you know what value should be appended advance, regardless of the actual value of `node.value`.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Function}**: Returns a compiler middleware function.

**Example**

```js
snapdragon.compiler
  .set('i', function(node) {
    this.mapVisit(node);
  })
  .set('i.open', utils.append('<i>'))
  .set('i.close', utils.append('</i>'))
```

### [.toNoop](index.js#L118)

Used in compiler middleware, this onverts an AST node into an empty `text` node and deletes `node.nodes` if it exists. The advantage of this method is that, as opposed to completely removing the node, indices will not need to be re-calculated in sibling nodes, and nothing is appended to the output.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `nodes` **{Array}**: Optionally pass a new `nodes` value, to replace the existing `node.nodes` array.

**Example**

```js
utils.toNoop(node);
// convert `node.nodes` to the given value instead of deleting it
utils.toNoop(node, []);
```

### [.visit](index.js#L147)

Visit `node` with the given `fn`. The built-in `.visit` method in snapdragon automatically calls registered compilers, this allows you to pass a visitor function.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `fn` **{Function}**
* `returns` **{Object}**: returns the node after recursively visiting all child nodes.

**Example**

```js
snapdragon.compiler.set('i', function(node) {
  utils.visit(node, function(childNode) {
    // do stuff with "childNode"
    return childNode;
  });
});
```

### [.mapVisit](index.js#L174)

Map [visit](#visit) the given `fn` over `node.nodes`. This is called by [visit](#visit), use this method if you do not want `fn` to be called on the first node.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `options` **{Object}**
* `fn` **{Function}**
* `returns` **{Object}**: returns the node

**Example**

```js
snapdragon.compiler.set('i', function(node) {
  utils.mapVisit(node, function(childNode) {
    // do stuff with "childNode"
    return childNode;
  });
});
```

### [.addOpen](index.js#L213)

Unshift an `*.open` node onto `node.nodes`.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `Node` **{Function}**: (required) Node constructor function from [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node).
* `filter` **{Function}**: Optionaly specify a filter function to exclude the node.
* `returns` **{Object}**: Returns the created opening node.

**Example**

```js
var Node = require('snapdragon-node');
snapdragon.parser.set('brace', function(node) {
  var match = this.match(/^{/);
  if (match) {
    var parent = new Node({type: 'brace'});
    utils.addOpen(parent, Node);
    console.log(parent.nodes[0]):
    // { type: 'brace.open', value: '' };

    // push the parent "brace" node onto the stack
    this.push(parent);

    // return the parent node, so it's also added to the AST
    return brace;
  }
});
```

### [.addClose](index.js#L263)

Push a `*.close` node onto `node.nodes`.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `Node` **{Function}**: (required) Node constructor function from [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node).
* `filter` **{Function}**: Optionaly specify a filter function to exclude the node.
* `returns` **{Object}**: Returns the created closing node.

**Example**

```js
var Node = require('snapdragon-node');
snapdragon.parser.set('brace', function(node) {
  var match = this.match(/^}/);
  if (match) {
    var parent = this.parent();
    if (parent.type !== 'brace') {
      throw new Error('missing opening: ' + '}');
    }

    utils.addClose(parent, Node);
    console.log(parent.nodes[parent.nodes.length - 1]):
    // { type: 'brace.close', value: '' };

    // no need to return a node, since the parent
    // was already added to the AST
    return;
  }
});
```

### [.wrapNodes](index.js#L293)

Wraps the given `node` with `*.open` and `*.close` nodes.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `Node` **{Function}**: (required) Node constructor function from [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node).
* `filter` **{Function}**: Optionaly specify a filter function to exclude the node.
* `returns` **{Object}**: Returns the node

### [.pushNode](index.js#L318)

Push the given `node` onto `parent.nodes`, and set `parent` as `node.parent.

**Params**

* `parent` **{Object}**
* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Object}**: Returns the child node

**Example**

```js
var parent = new Node({type: 'foo'});
var node = new Node({type: 'bar'});
utils.pushNode(parent, node);
console.log(parent.nodes[0].type) // 'bar'
console.log(node.parent.type) // 'foo'
```

### [.unshiftNode](index.js#L348)

Unshift `node` onto `parent.nodes`, and set `parent` as `node.parent.

**Params**

* `parent` **{Object}**
* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{undefined}**

**Example**

```js
var parent = new Node({type: 'foo'});
var node = new Node({type: 'bar'});
utils.unshiftNode(parent, node);
console.log(parent.nodes[0].type) // 'bar'
console.log(node.parent.type) // 'foo'
```

### [.popNode](index.js#L381)

Pop the last `node` off of `parent.nodes`. The advantage of using this method is that it checks for `node.nodes` and works with any version of `snapdragon-node`.

**Params**

* `parent` **{Object}**
* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Number|Undefined}**: Returns the length of `node.nodes` or undefined.

**Example**

```js
var parent = new Node({type: 'foo'});
utils.pushNode(parent, new Node({type: 'foo'}));
utils.pushNode(parent, new Node({type: 'bar'}));
utils.pushNode(parent, new Node({type: 'baz'}));
console.log(parent.nodes.length); //=> 3
utils.popNode(parent);
console.log(parent.nodes.length); //=> 2
```

### [.shiftNode](index.js#L409)

Shift the first `node` off of `parent.nodes`. The advantage of using this method is that it checks for `node.nodes` and works with any version of `snapdragon-node`.

**Params**

* `parent` **{Object}**
* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Number|Undefined}**: Returns the length of `node.nodes` or undefined.

**Example**

```js
var parent = new Node({type: 'foo'});
utils.pushNode(parent, new Node({type: 'foo'}));
utils.pushNode(parent, new Node({type: 'bar'}));
utils.pushNode(parent, new Node({type: 'baz'}));
console.log(parent.nodes.length); //=> 3
utils.shiftNode(parent);
console.log(parent.nodes.length); //=> 2
```

### [.removeNode](index.js#L436)

Remove the specified `node` from `parent.nodes`.

**Params**

* `parent` **{Object}**
* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Object|undefined}**: Returns the removed node, if successful, or undefined if it does not exist on `parent.nodes`.

**Example**

```js
var parent = new Node({type: 'abc'});
var foo = new Node({type: 'foo'});
utils.pushNode(parent, foo);
utils.pushNode(parent, new Node({type: 'bar'}));
utils.pushNode(parent, new Node({type: 'baz'}));
console.log(parent.nodes.length); //=> 3
utils.removeNode(parent, foo);
console.log(parent.nodes.length); //=> 2
```

### [.isType](index.js#L467)

Returns true if `node.type` matches the given `type`. Throws a `TypeError` if `node` is not an instance of `Node`.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `type` **{String}**
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var node = new Node({type: 'foo'});
console.log(utils.isType(node, 'foo')); // false
console.log(utils.isType(node, 'bar')); // true
```

### [.hasType](index.js#L509)

Returns true if the given `node` has the given `type` in `node.nodes`. Throws a `TypeError` if `node` is not an instance of `Node`.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
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

### [.firstOfType](index.js#L542)

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
    new Node({type: 'text', value: 'abc'}),
    new Node({type: 'text', value: 'xyz'})
  ]
});

var textNode = utils.firstOfType(node.nodes, 'text');
console.log(textNode.value);
//=> 'abc'
```

### [.findNode](index.js#L578)

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
    new Node({type: 'text', value: 'abc'}),
    new Node({type: 'text', value: 'xyz'})
  ]
});

var nodeOne = utils.findNode(node.nodes, 'text');
console.log(nodeOne.value);
//=> 'abc'

var nodeTwo = utils.findNode(node.nodes, 1);
console.log(nodeTwo.value);
//=> 'xyz'
```

### [.isOpen](index.js#L602)

Returns true if the given node is an "*.open" node.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
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

### [.isClose](index.js#L631)

Returns true if the given node is a "*.close" node.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
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

### [.isBlock](index.js#L662)

Returns true if the given node is an "*.open" node.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Boolean}**

**Example**

```js
var Node = require('snapdragon-node');
var brace = new Node({type: 'brace'});
var open = new Node({type: 'brace.open', value: '{'});
var inner = new Node({type: 'text', value: 'a,b,c'});
var close = new Node({type: 'brace.close', value: '}'});
brace.push(open);
brace.push(inner);
brace.push(close);

console.log(utils.isBlock(brace)); // true
```

### [.hasNode](index.js#L691)

Returns true if `parent.nodes` has the given `node`.

**Params**

* `type` **{String}**
* `returns` **{Boolean}**

**Example**

```js
const foo = new Node({type: 'foo'});
const bar = new Node({type: 'bar'});
cosole.log(util.hasNode(foo, bar)); // false
foo.push(bar);
cosole.log(util.hasNode(foo, bar)); // true
```

### [.hasOpen](index.js#L723)

Returns true if `node.nodes` **has** an `.open` node

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
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

brace.pushNode(open);
console.log(utils.hasOpen(brace)); // true
```

### [.hasClose](index.js#L754)

Returns true if `node.nodes` **has** a `.close` node

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
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

brace.pushNode(close);
console.log(utils.hasClose(brace)); // true
```

### [.hasOpenAndClose](index.js#L789)

Returns true if `node.nodes` has both `.open` and `.close` nodes

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
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

brace.pushNode(open);
brace.pushNode(close);
console.log(utils.hasOpen(brace)); // true
console.log(utils.hasClose(brace)); // true
```

### [.addType](index.js#L811)

Push the given `node` onto the `state.inside` array for the given type. This array is used as a specialized "stack" for only the given `node.type`.

**Params**

* `state` **{Object}**: The `compiler.state` object or custom state object.
* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Array}**: Returns the `state.inside` stack for the given type.

**Example**

```js
var state = { inside: {}};
var node = new Node({type: 'brace'});
utils.addType(state, node);
console.log(state.inside);
//=> { brace: [{type: 'brace'}] }
```

### [.removeType](index.js#L851)

Remove the given `node` from the `state.inside` array for the given type. This array is used as a specialized "stack" for only the given `node.type`.

**Params**

* `state` **{Object}**: The `compiler.state` object or custom state object.
* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `returns` **{Array}**: Returns the `state.inside` stack for the given type.

**Example**

```js
var state = { inside: {}};
var node = new Node({type: 'brace'});
utils.addType(state, node);
console.log(state.inside);
//=> { brace: [{type: 'brace'}] }
utils.removeType(state, node);
//=> { brace: [] }
```

### [.isEmpty](index.js#L880)

Returns true if `node.value` is an empty string, or `node.nodes` does not contain any non-empty text nodes.

**Params**

* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `fn` **{Function}**
* `returns` **{Boolean}**

**Example**

```js
var node = new Node({type: 'text'});
utils.isEmpty(node); //=> true
node.value = 'foo';
utils.isEmpty(node); //=> false
```

### [.isInsideType](index.js#L922)

Returns true if the `state.inside` stack for the given type exists and has one or more nodes on it.

**Params**

* `state` **{Object}**
* `type` **{String}**
* `returns` **{Boolean}**

**Example**

```js
var state = { inside: {}};
var node = new Node({type: 'brace'});
console.log(utils.isInsideType(state, 'brace')); //=> false
utils.addType(state, node);
console.log(utils.isInsideType(state, 'brace')); //=> true
utils.removeType(state, node);
console.log(utils.isInsideType(state, 'brace')); //=> false
```

### [.isInside](index.js#L956)

Returns true if `node` is either a child or grand-child of the given `type`, or `state.inside[type]` is a non-empty array.

**Params**

* `state` **{Object}**: Either the `compiler.state` object, if it exists, or a user-supplied state object.
* `node` **{Object}**: Instance of [snapdragon-node](https://github.com/jonschlinkert/snapdragon-node)
* `type` **{String}**: The `node.type` to check for.
* `returns` **{Boolean}**

**Example**

```js
var state = { inside: {}};
var node = new Node({type: 'brace'});
var open = new Node({type: 'brace.open'});
console.log(utils.isInside(state, open, 'brace')); //=> false
utils.pushNode(node, open);
console.log(utils.isInside(state, open, 'brace')); //=> true
```

### [.last](index.js#L1004)

Get the last `n` element from the given `array`. Used for getting
a node from `node.nodes.`

**Params**

* `array` **{Array}**
* `n` **{Number}**
* `returns` **{undefined}**

### [.arrayify](index.js#L1028)

Cast the given `value` to an array.

**Params**

* `value` **{any}**
* `returns` **{Array}**

**Example**

```js
console.log(utils.arrayify(''));
//=> []
console.log(utils.arrayify('foo'));
//=> ['foo']
console.log(utils.arrayify(['foo']));
//=> ['foo']
```

### [.stringify](index.js#L1047)

Convert the given `value` to a string by joining with `,`. Useful
for creating a cheerio/CSS/DOM-style selector from a list of strings.

**Params**

* `value` **{any}**
* `returns` **{Array}**

### [.trim](index.js#L1060)

Ensure that the given value is a string and call `.trim()` on it,
or return an empty string.

**Params**

* `str` **{String}**
* `returns` **{String}**

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](.github/contributing.md) for advice on opening issues, pull requests, and coding standards.

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>
<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Related projects

You might also be interested in these projects:

* [snapdragon-node](https://www.npmjs.com/package/snapdragon-node): Snapdragon utility for creating a new AST node in custom code, such as plugins. | [homepage](https://github.com/jonschlinkert/snapdragon-node "Snapdragon utility for creating a new AST node in custom code, such as plugins.")
* [snapdragon-position](https://www.npmjs.com/package/snapdragon-position): Snapdragon util and plugin for patching the position on an AST node. | [homepage](https://github.com/here-be/snapdragon-position "Snapdragon util and plugin for patching the position on an AST node.")
* [snapdragon-token](https://www.npmjs.com/package/snapdragon-token): Create a snapdragon token. Used by the snapdragon lexer, but can also be used by… [more](https://github.com/here-be/snapdragon-token) | [homepage](https://github.com/here-be/snapdragon-token "Create a snapdragon token. Used by the snapdragon lexer, but can also be used by plugins.")

### Contributors

| **Commits** | **Contributor** | 
| --- | --- |
| 43 | [jonschlinkert](https://github.com/jonschlinkert) |
| 2 | [realityking](https://github.com/realityking) |

### Author

**Jon Schlinkert**

* [linkedin/in/jonschlinkert](https://linkedin.com/in/jonschlinkert)
* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](https://twitter.com/jonschlinkert)

### License

Copyright © 2018, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.6.0, on January 11, 2018._