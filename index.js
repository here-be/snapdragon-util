'use strict';

var typeOf = require('kind-of');
var define = require('define-property');
var Node = require('snapdragon-node');

/**
 * Expose `utils`
 */

var utils = module.exports;

/**
 * Emit an empty string to effectively "skip" the string for the given `node`,
 * but still emit the position and node type.
 *
 * ```js
 * // do nothing for beginning-of-string
 * snapdragon.compiler.set('bos', utils.noop);
 * ```
 * @param {Object} node
 * @api public
 */

utils.noop = function(node) {
  this.emit('', node);
};

/**
 * Emit an empty string to effectively "skip" the string for the given `node`,
 * but still emit the position and node type.
 *
 * ```js
 * snapdragon.compiler
 *   .set('i', function(node) {
 *     this.mapVisit(node);
 *   })
 *   .set('i.open', helpers.emit('<i>'))
 *   .set('i.close', helpers.emit('</i>'))
 * ```
 * @param {Object} node
 * @api public
 */

utils.emit = function(val) {
  return function(node) {
    this.emit(val, node);
  };
};

/**
 * Converts an AST node into an empty `text` node and delete `node.nodes`.
 *
 * ```js
 * utils.toNoop(node);
 * utils.toNoop(node, true); // convert `node.nodes` to an empty array
 * ```
 * @param {Object} `node`
 * @api public
 */

utils.toNoop = function(node, keepNodes) {
  if (keepNodes === true) {
    node.nodes = [];
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
 * snapdragon.compiler
 *   .set('i', function(node) {
 *     utils.visit(node, function(node2) {
 *       // do stuff with "node2"
 *       return node2;
 *     });
 *   })
 * ```
 * @param {Object} `node`
 * @param {Function} `fn`
 * @return {Object} returns the node
 * @api public
 */

utils.visit = function(node, options, fn) {
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
    utils.mapVisit(node, options, fn);
  }
  return node;
};

/**
 * Map [visit](#visit) with the given `fn` over an array of AST `nodes`.
 *
 * ```js
 * snapdragon.compiler
 *   .set('i', function(node) {
 *     utils.mapVisit(node, function(node2) {
 *       // do stuff with "node2"
 *       return node2;
 *     });
 *   })
 * ```
 * @api public
 */

utils.mapVisit = function(parent, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  var nodes = parent.nodes || parent.children;
  if (!Array.isArray(nodes)) {
    throw new TypeError('.mapVisit: exected parent.nodes to be an array');
  }

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    define(node, 'parent', parent);
    nodes[i] = utils.visit(node, options, fn) || node;

    // reset properties on `nodes[i]` in case the returned
    // node was user-defined and the properties were lost
    define(nodes[i], 'parent', parent);
  }
  return node;
};

/**
 * Wrap the given `node` with `*.open` and `*.close` tags.
 *
 * @param {Object} `node`
 * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
 * @return {undefined}
 * @api public
 */

utils.wrapNodes = function(node, filter) {
  utils.addOpen(node, filter);
  utils.addClose(node, filter);
};

/**
 * Unshift an `*.open` node onto `node.nodes`.
 *
 * @param {Object} `node`
 * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
 * @return {undefined}
 * @api public
 */

utils.addOpen = function(node, filter) {
  if (typeof filter === 'function' && !filter(node)) return;
  var open = new Node({ type: node.type + '.open', val: ''});
  if (node.isNode && node.pushNode) {
    node.unshiftNode(open);
  } else {
    utils.unshiftNode(node, open);
  }
};

/**
 * Push a `*.close` node onto `node.nodes`.
 *
 * @param {Object} `node`
 * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
 * @return {undefined}
 * @api public
 */

utils.addClose = function(node, filter) {
  if (typeof filter === 'function' && !filter(node)) return;
  var close = new Node({ type: node.type + '.close', val: ''});
  if (node.isNode && node.pushNode) {
    node.pushNode(close);
  } else {
    utils.pushNode(node, close);
  }
};

/**
 * Push `node` onto `parent.nodes`.
 *
 * ```js
 * var parent = new Node({type: 'foo'});
 * var node = new Node({type: 'bar'});
 * utils.pushNode(parent, node);
 * console.log(parent.nodes[0].type) // 'bar'
 * ```
 * @param {Object} `node`
 * @param {Function} `filter` Optionaly specify a filter function to exclude the node.
 * @return {undefined}
 * @api public
 */

utils.pushNode = function(parent, node) {
  parent.nodes = parent.nodes || [];
  node.define('parent', parent);
  parent.nodes.push(node);
};

/**
 * Unshift `node` onto `parent.nodes`.
 *
 * ```js
 * var parent = new Node({type: 'foo'});
 * var node = new Node({type: 'bar'});
 * utils.unshiftNode(parent, node);
 * console.log(parent.nodes[0].type) // 'bar'
 * ```
 * @param {Object} `node`
 * @return {undefined}
 * @api public
 */

utils.unshiftNode = function(parent, node) {
  parent.nodes = parent.nodes || [];
  node.define('parent', parent);
  parent.nodes.unshift(node);
};

/**
 * Get the last `n` element from the given `array`. Used for getting
 * a node from `node.nodes.`
 *
 * @param {Array} `array`
 * @return {*}
 */

utils.last = function(arr, n) {
  return arr[arr.length - (n || 1)];
};

/**
 * Return true if node is the given `type`
 */

utils.isType = function(node, type) {
  if (typeOf(node) !== 'object' || !node.type) {
    throw new TypeError('expected node to be an object');
  }
  switch (typeOf(type)) {
    case 'array':
      var types = type.slice();
      for (var i = 0; i < types.length; i++) {
        if (utils.isType(node, types[i])) {
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
 * Return true if `nodes` has the given `type`
 */

utils.hasType = function(node, type) {
  if (!Array.isArray(node.nodes)) return false;
  for (var i = 0; i < node.nodes.length; i++) {
    if (utils.isType(node.nodes[i], type)) {
      return true;
    }
  }
  return false;
};

/**
 * Return the first node from `nodes` of the given `type`
 *
 * ```js
 * snapdragon.set('div', function(node) {
 *  var textNode = utils.firstOfType(node.nodes, 'text');
 *  if (textNode) {
 *    // do stuff with text node
 *  }
 * });
 * ```
 * @param {Array} `nodes`
 * @param {String} `type`
 * @return {Object} Returns a node, if found
 * @api public
 */

utils.firstOfType = function(nodes, type) {
  if (!Array.isArray(nodes)) {
    throw new TypeError('expected nodes to be an array');
  }

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (utils.isType(node, type)) {
      return node;
    }
  }
};

/**
 * Get the a node from `node.nodes`. If `type` is a number, the
 * node at that index is returned, otherwise [.firstOfType()](#firstOfType)
 * is called to get the first node that matches the given `type`.
 */

utils.getNode = function(nodes, type) {
  if (!Array.isArray(nodes)) return;
  if (typeof type === 'number') {
    return nodes[type];
  }
  return utils.firstOfType(nodes, type);
};

/**
 * Return true if node is for an "open" tag
 */

utils.isOpen = function(node) {
  if (typeOf(node) !== 'object' || typeof node.type !== 'string') {
    throw new TypeError('expected node to be an object');
  }
  return node.type.slice(-5) === '.open';
};

/**
 * Return true if node is for a "close" tag
 */

utils.isClose = function(node) {
  if (typeOf(node) !== 'object' || typeof node.type !== 'string') {
    throw new TypeError('expected node to be an object');
  }
  return node.type.slice(-6) === '.close';
};

/**
 * Return true if `node.nodes` has an `.open` node
 */

utils.hasOpen = function(node) {
  if (typeOf(node) !== 'object' || typeof node.type !== 'string') {
    throw new TypeError('expected node to be an object');
  }
  return node.nodes && node.nodes[0].type === (node.type + '.open');
};

/**
 * Return true if `node.nodes` has a `.close` node
 */

utils.hasClose = function(node) {
  if (typeOf(node) !== 'object' || typeof node.type !== 'string') {
    throw new TypeError('expected node to be an object');
  }
  return node.nodes && utils.last(node.nodes).type === (node.type + '.close');
};

/**
 * Return true if `node.nodes` has both `.open` and `.close` nodes
 */

utils.hasOpenAndClose = function(node) {
  return utils.hasOpen(node) && utils.hasClose(node);
};

/**
 * Add the given `node` to the `state.inside` stack for that type.
 */

utils.addType = function(state, node) {
  if (typeOf(state) !== 'object') {
    throw new TypeError('expected state to be an object');
  }
  if (typeOf(node) !== 'object') {
    throw new TypeError('expected node to be an object');
  }
  var type = node.type.replace(/\.open$/, '');
  if (!state.inside.hasOwnProperty(type)) {
    state.inside[type] = [];
  }
  state.inside[type].push(node);
};

/**
 * Remove the given `node` from the `state.inside` array for that type.
 */

utils.removeType = function(state, node) {
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
 * Return true if `node.nodes` contains only open and close nodes,
 * or open, close and an empty text node.
 */

utils.isEmptyNodes = function(node, prefix) {
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
    return utils.isType(first, 'text') && !first.val.trim();
  }
  return false;
};

/**
 * Return true if inside the current `type`
 */

utils.isInsideType = function(state, type) {
  if (typeOf(state) !== 'object') {
    throw new TypeError('expected state to be an object');
  }
  return state.inside.hasOwnProperty(type) && state.inside[type].length > 0;
};

/**
 * Return true if `node` is inside the current `type`
 */

utils.isInside = function(state, node, type) {
  if (typeOf(state) !== 'object') {
    throw new TypeError('expected state to be an object');
  }
  if (typeOf(node) !== 'object') {
    throw new TypeError('expected node to be an object');
  }

  if (Array.isArray(type)) {
    for (var i = 0; i < type.length; i++) {
      if (utils.isInside(state, node, type[i])) {
        return true;
      }
    }
    return false;
  }

  var parent = node.parent || {};
  if (typeof type === 'string') {
    return utils.isInsideType(state, type) || parent.type === type;
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
 * Cast the given `val` to an array.
 * @param {any} `val`
 * @return {Array}
 * @api public
 */

utils.arrayify = function(val) {
  return val ? (Array.isArray(val) ? val : [val]) : [];
};

/**
 * Convert the given `val` to a string by joining with `,`. Useful
 * for creating a selector from a list of strings.
 *
 * @param {any} `val`
 * @return {Array}
 * @api public
 */

utils.stringify = function(val) {
  return utils.arrayify(val).join(',');
};
