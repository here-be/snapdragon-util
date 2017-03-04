'use strict';

var typeOf = require('kind-of');

/**
 * Returns true if the given value is a node.
 *
 * ```js
 * var node = snapdragon.parser.node({type: 'foo'});
 * console.log(utils.isNode(node)); //=> true
 * console.log(utils.isNode({})); //=> false
 * ```
 * @param {Object} `node`
 * @api public
 */

exports.isNode = function(node) {
  return typeOf(node) === 'object' && node.isNode;
};

/**
 * Emit an empty string for the given `node`.
 *
 * ```js
 * // do nothing for beginning-of-string
 * snapdragon.compiler.set('bos', utils.noop);
 * ```
 * @param {Object} `node`
 * @api public
 */

exports.noop = function(node) {
  this.emit('', node);
};

/**
 * Emit `val` for the given node. Useful when you know what needs to be
 * emitted in advance and you don't need to access the actual node.
 *
 * ```js
 * snapdragon.compiler
 *   .set('i', function(node) {
 *     this.mapVisit(node);
 *   })
 *   .set('i.open', utils.emit('<i>'))
 *   .set('i.close', utils.emit('</i>'))
 * ```
 * @param {Object} `node`
 * @api public
 */

exports.emit = function(val) {
  return function(node) {
    this.emit(val, node);
  };
};

/**
 * Converts an AST node into an empty `text` node and deletes `node.nodes`.
 *
 * ```js
 * utils.toNoop(node);
 * // convert `node.nodes` to the given value instead of deleting it
 * utils.toNoop(node, []);
 * ```
 * @param {Object} `node`
 * @api public
 */

exports.toNoop = function(node, nodes) {
  if (nodes) {
    node.nodes = nodes;
  } else {
    delete node.nodes;
  }
  node.type = 'text';
  node.val = '';
};

/**
 * Visit `node` with the given `fn`. The built-in `.visit` method in snapdragon
 * automatically calls registered compilers, this allows you to pass a visitor
 * function.
 *
 * ```js
 * snapdragon.compiler.set('i', function(node) {
 *   utils.visit(node, function(node2) {
 *     // do stuff with "node2"
 *     return node2;
 *   });
 * });
 * ```
 * @param {Object} `node`
 * @param {Object} `options` Set `options.recurse` to true call recursively call `mapVisit` on `node.nodes`.
 * @param {Function} `fn`
 * @return {Object} returns the node
 * @api public
 */

exports.visit = function(node, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  if (typeOf(node) !== 'object') {
    throw new TypeError('expected node to be an object');
  }
  if (typeOf(fn) !== 'function') {
    throw new TypeError('expected visitor to be a function');
  }

  node = fn(node) || node;
  var nodes = node.nodes || node.children;
  if (options && options.recurse && Array.isArray(nodes)) {
    exports.mapVisit(node, options, fn);
  }
  return node;
};

/**
 * Map [visit](#visit) with the given `fn` over an array of AST `nodes`.
 *
 * ```js
 * snapdragon.compiler.set('i', function(node) {
 *   utils.mapVisit(node, function(node2) {
 *     // do stuff with "node2"
 *     return node2;
 *   });
 * });
 * ```
 * @param {Object} `node`
 * @param {Object} `options`
 * @param {Function} `fn`
 * @return {Object} returns the node
 * @api public
 */

exports.mapVisit = function(node, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  if (!Array.isArray(node.nodes)) {
    throw new TypeError('.mapVisit: exected node.nodes to be an array');
  }

  for (var i = 0; i < node.nodes.length; i++) {
    exports.visit(node.nodes[i], options, fn);
  }
  return node;
};

/**
 * Wraps the given `node` with `*.open` and `*.close` nodes.
 *
 * @param {Object} `node` (required)
 * @param {Function} `Node` (required) Node constructor function from [snapdragon-node][].
 * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
 * @return {undefined}
 * @api public
 */

exports.wrapNodes = function(node, Node, filter) {
  exports.addOpen(node, Node, filter);
  exports.addClose(node, Node, filter);
};

/**
 * Unshift an `*.open` node onto `node.nodes`.
 *
 * @param {Object} `node`
 * @param {Function} `Node` (required) Node constructor function from [snapdragon-node][].
 * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
 * @return {undefined}
 * @api public
 */

exports.addOpen = function(node, Node, filter) {
  if (typeof filter === 'function' && !filter(node)) return;
  var open = new Node({ type: node.type + '.open', val: ''});
  if (node.isNode && node.pushNode) {
    node.unshiftNode(open);
  } else {
    exports.unshiftNode(node, open);
  }
};

/**
 * Push a `*.close` node onto `node.nodes`.
 *
 * @param {Object} `node`
 * @param {Function} `Node` (required) Node constructor function from [snapdragon-node][].
 * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
 * @return {undefined}
 * @api public
 */

exports.addClose = function(node, Node, filter) {
  if (typeof filter === 'function' && !filter(node)) return;
  var close = new Node({ type: node.type + '.close', val: ''});
  if (node.isNode && node.pushNode) {
    node.pushNode(close);
  } else {
    exports.pushNode(node, close);
  }
};

/**
 * Push the given `node` onto `parent.nodes`, and set `parent` as `node.parent.
 *
 * ```js
 * var parent = new Node({type: 'foo'});
 * var node = new Node({type: 'bar'});
 * utils.pushNode(parent, node);
 * console.log(parent.nodes[0].type) // 'bar'
 * console.log(node.parent.type) // 'foo'
 * ```
 * @param {Object} `parent`
 * @param {Object} `node`
 * @return {undefined}
 * @api public
 */

exports.pushNode = function(parent, node) {
  parent.nodes = parent.nodes || [];
  node.define('parent', parent);
  parent.nodes.push(node);
};

/**
 * Unshift `node` onto `parent.nodes`, and set `parent` as `node.parent.
 *
 * ```js
 * var parent = new Node({type: 'foo'});
 * var node = new Node({type: 'bar'});
 * utils.unshiftNode(parent, node);
 * console.log(parent.nodes[0].type) // 'bar'
 * console.log(node.parent.type) // 'foo'
 * ```
 * @param {Object} `parent`
 * @param {Object} `node`
 * @return {undefined}
 * @api public
 */

exports.unshiftNode = function(parent, node) {
  parent.nodes = parent.nodes || [];
  node.define('parent', parent);
  parent.nodes.unshift(node);
};

/**
 * Returns true if `node` is a valid [Node][snapdragon-node] and
 * `node.type` matches the given `type`.
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var node = new Node({type: 'foo'});
 * console.log(utils.isType(node, 'foo')); // false
 * console.log(utils.isType(node, 'bar')); // true
 * ```
 * @param {Object} `node`
 * @param {String} `type`
 * @return {Boolean}
 * @api public
 */

exports.isType = function(node, type) {
  if (typeOf(node) !== 'object' || !node.type) {
    throw new TypeError('expected node to be an object');
  }
  switch (typeOf(type)) {
    case 'array':
      var types = type.slice();
      for (var i = 0; i < types.length; i++) {
        if (exports.isType(node, types[i])) {
          return true;
        }
      }
      return false;
    case 'string':
      return node.type === type;
    case 'regexp':
      return type.test(node.type);
    default: {
      throw new TypeError('expected "type" to be an array, string or regexp');
    }
  }
};

/**
 * Returns true if the given `node` has the given `type` in `node.nodes`.
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var node = new Node({
 *   type: 'foo',
 *   nodes: [
 *     new Node({type: 'bar'}),
 *     new Node({type: 'baz'})
 *   ]
 * });
 * console.log(utils.hasType(node, 'xyz')); // false
 * console.log(utils.hasType(node, 'baz')); // true
 * ```
 * @param {Object} `node`
 * @param {String} `type`
 * @return {Boolean}
 * @api public
 */

exports.hasType = function(node, type) {
  if (!Array.isArray(node.nodes)) return false;
  for (var i = 0; i < node.nodes.length; i++) {
    if (exports.isType(node.nodes[i], type)) {
      return true;
    }
  }
  return false;
};

/**
 * Returns the first node from `node.nodes` of the given `type`
 *
 * ```js
 * var node = new Node({
 *   type: 'foo',
 *   nodes: [
 *     new Node({type: 'text', val: 'abc'}),
 *     new Node({type: 'text', val: 'xyz'})
 *   ]
 * });
 *
 * var textNode = utils.firstOfType(node.nodes, 'text');
 * console.log(textNode.val);
 * //=> 'abc'
 * ```
 * @param {Array} `nodes`
 * @param {String} `type`
 * @return {Object|undefined} Returns the first matching node or undefined.
 * @api public
 */

exports.firstOfType = function(nodes, type) {
  if (!Array.isArray(nodes)) {
    throw new TypeError('expected nodes to be an array');
  }

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (exports.isType(node, type)) {
      return node;
    }
  }
};

/**
 * Returns the node at the specified index, or the first node of the
 * given `type` from `node.nodes`.
 *
 * ```js
 * var node = new Node({
 *   type: 'foo',
 *   nodes: [
 *     new Node({type: 'text', val: 'abc'}),
 *     new Node({type: 'text', val: 'xyz'})
 *   ]
 * });
 *
 * var nodeOne = utils.getNode(node.nodes, 'text');
 * console.log(nodeOne.val);
 * //=> 'abc'
 *
 * var nodeTwo = utils.getNode(node.nodes, 1);
 * console.log(nodeTwo.val);
 * //=> 'xyz'
 * ```
 *
 * @param {Array} `nodes`
 * @param {String|Number} `type` Node type or index.
 * @return {Object} Returns a node or undefined.
 * @api public
 */

exports.getNode = function(nodes, type) {
  if (!Array.isArray(nodes)) return;
  if (typeof type === 'number') {
    return nodes[type];
  }
  return exports.firstOfType(nodes, type);
};

/**
 * Returns true if the given node is an "*.open" node.
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var brace = new Node({type: 'brace'});
 * var open = new Node({type: 'brace.open'});
 * var close = new Node({type: 'brace.close'});
 *
 * console.log(utils.isOpen(brace)); // false
 * console.log(utils.isOpen(open)); // true
 * console.log(utils.isOpen(close)); // false
 * ```
 * @param {Object} `node`
 * @return {Boolean}
 * @api public
 */

exports.isOpen = function(node) {
  if (typeOf(node) !== 'object' || typeof node.type !== 'string') {
    throw new TypeError('expected node to be an object');
  }
  return node.type.slice(-5) === '.open';
};

/**
 * Returns true if the given node is a "*.close" node.
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var brace = new Node({type: 'brace'});
 * var open = new Node({type: 'brace.open'});
 * var close = new Node({type: 'brace.close'});
 *
 * console.log(utils.isClose(brace)); // false
 * console.log(utils.isClose(open)); // false
 * console.log(utils.isClose(close)); // true
 * ```
 * @param {Object} `node`
 * @return {Boolean}
 * @api public
 */

exports.isClose = function(node) {
  if (typeOf(node) !== 'object' || typeof node.type !== 'string') {
    throw new TypeError('expected node to be an object');
  }
  return node.type.slice(-6) === '.close';
};

/**
 * Returns true if `node.nodes` **has** an `.open` node
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var brace = new Node({
 *   type: 'brace',
 *   nodes: []
 * });
 *
 * var open = new Node({type: 'brace.open'});
 * console.log(utils.hasOpen(brace)); // false
 *
 * brace.addNode(open);
 * console.log(utils.hasOpen(brace)); // true
 * ```
 * @param {Object} `node`
 * @return {Boolean}
 * @api public
 */

exports.hasOpen = function(node) {
  if (typeOf(node) !== 'object' || typeof node.type !== 'string') {
    throw new TypeError('expected node to be an object');
  }
  return node.nodes && node.nodes[0].type === (node.type + '.open');
};

/**
 * Returns true if `node.nodes` **has** a `.close` node
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var brace = new Node({
 *   type: 'brace',
 *   nodes: []
 * });
 *
 * var close = new Node({type: 'brace.close'});
 * console.log(utils.hasClose(brace)); // false
 *
 * brace.addNode(close);
 * console.log(utils.hasClose(brace)); // true
 * ```
 * @param {Object} `node`
 * @return {Boolean}
 * @api public
 */

exports.hasClose = function(node) {
  if (typeOf(node) !== 'object' || typeof node.type !== 'string') {
    throw new TypeError('expected node to be an object');
  }
  return node.nodes && exports.last(node.nodes).type === (node.type + '.close');
};

/**
 * Returns true if `node.nodes` has both `.open` and `.close` nodes
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var brace = new Node({
 *   type: 'brace',
 *   nodes: []
 * });
 *
 * var open = new Node({type: 'brace.open'});
 * var close = new Node({type: 'brace.close'});
 * console.log(utils.hasOpen(brace)); // false
 * console.log(utils.hasClose(brace)); // false
 *
 * brace.addNode(open);
 * brace.addNode(close);
 * console.log(utils.hasOpen(brace)); // true
 * console.log(utils.hasClose(brace)); // true
 * ```
 * @param {Object} `node`
 * @return {Boolean}
 * @api public
 */

exports.hasOpenAndClose = function(node) {
  return exports.hasOpen(node) && exports.hasClose(node);
};

/**
 * Push the given `node` onto the `state.inside` array for the
 * given type. This array is used as a "stack" for the given `node.type`.
 *
 * @param {Object} `state` The `compiler.state` object or custom state object.
 * @param {Object} `node`
 * @return {undefined}
 * @api public
 */

exports.addType = function(state, node) {
  if (typeOf(state) !== 'object') {
    throw new TypeError('expected state to be an object');
  }
  if (typeOf(node) !== 'object') {
    throw new TypeError('expected node to be an object');
  }

  var type = node.type.replace(/\.open$/, '');
  state.inside = state.inside || {};

  if (!state.inside.hasOwnProperty(type)) {
    state.inside[type] = [];
  }

  state.inside[type].push(node);
};

/**
 * Remove the given `node` from the `state.inside` array for that type.
 */

exports.removeType = function(state, node) {
  if (typeOf(state) !== 'object') {
    throw new TypeError('expected state to be an object');
  }
  if (typeOf(node) !== 'object') {
    throw new TypeError('expected node to be an object');
  }

  var type = node.type.replace(/\.close$/, '');
  if (!state.inside.hasOwnProperty(type)) {
    throw new Error('expected state.inside.' + type + ' to be an array');
  }
  state.inside[type].pop();
};

/**
 * Returns true if `node.nodes` contains only open and close nodes,
 * or open, close and an empty text node.
 */

exports.isEmptyNodes = function(node, prefix) {
  if (typeOf(node) !== 'object') {
    throw new TypeError('expected node to be an object');
  }
  if (!Array.isArray(node.nodes)) {
    throw new TypeError('expected nodes to be an array');
  }
  var len = node.nodes.length;
  var first = node.nodes[1];
  if (len === 2) {
    return true;
  }
  if (len === 3) {
    return exports.isType(first, 'text') && !first.val.trim();
  }
  return false;
};

/**
 * Returns true if inside the current `type`
 */

exports.isInsideType = function(state, type) {
  if (typeOf(state) !== 'object') {
    throw new TypeError('expected state to be an object');
  }
  state.inside = state.inside || {};
  return state.inside.hasOwnProperty(type) && state.inside[type].length > 0;
};

/**
 * Returns true if `node` is inside the current `type`
 */

exports.isInside = function(state, node, type) {
  if (typeOf(state) !== 'object') {
    throw new TypeError('expected state to be an object');
  }
  if (typeOf(node) !== 'object') {
    throw new TypeError('expected node to be an object');
  }

  if (Array.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      if (exports.isInside(state, node, type[i])) {
        return true;
      }
    }
    return false;
  }

  var parent = node.parent || {};
  if (typeof type === 'string') {
    return exports.isInsideType(state, type) || parent.type === type;
  }

  if (typeOf(type) === 'regexp') {
    if (parent.type && type.test(parent.type)) {
      return true;
    }

    for (var key in state) {
      if (state.hasOwnProperty(key) && type.test(key)) {
        if (state[key] === true) {
          return true;
        }
      }
    }
  }
  return false;
};

/**
 * Get the last `n` element from the given `array`. Used for getting
 * a node from `node.nodes.`
 *
 * @param {Array} `array`
 * @param {Number} `n`
 * @return {undefined}
 * @api public
 */

exports.last = function(arr, n) {
  return arr[arr.length - (n || 1)];
};

/**
 * Cast the given `val` to an array.
 *
 * ```js
 * console.log(utils.arraify(''));
 * //=> []
 * console.log(utils.arraify('foo'));
 * //=> ['foo']
 * console.log(utils.arraify(['foo']));
 * //=> ['foo']
 * ```
 * @param {any} `val`
 * @return {Array}
 * @api public
 */

exports.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Convert the given `val` to a string by joining with `,`. Useful
 * for creating a cheerio/CSS/DOM-style selector from a list of strings.
 *
 * @param {any} `val`
 * @return {Array}
 * @api public
 */

exports.stringify = function(val) {
  return exports.arrayify(val).join(',');
};
