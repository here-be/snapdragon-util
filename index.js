"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeOf = require('kind-of');
/**
 * Returns true if the given value is a node.
 *
 * ```js
 * const Node = require('snapdragon-node');
 * const node = new Node({type: 'foo'});
 * console.log(utils.isNode(node)); //=> true
 * console.log(utils.isNode({})); //=> false
 * ```
 */
function isNode(node) {
    return isObject(node) && node.isNode === true;
}
exports.isNode = isNode;
/**
 * Emit an empty string for the given `node`.
 *
 * ```js
 * // do nothing for beginning-of-string
 * snapdragon.compiler.set('bos', utils.noop);
 * ```
 */
function noop(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    appendToCompiler(this, '', node);
}
exports.noop = noop;
/**
 * Returns `node.value` or `node.val`.
 *
 * ```js
 * const star = new Node({type: 'star', value: '*'});
 * const slash = new Node({type: 'slash', val: '/'});
 * console.log(utils.value(star)) //=> '*'
 * console.log(utils.value(slash)) //=> '/'
 * ```
 */
//TODO: is there really a need to check if (typeof node.value === 'string')?
function value(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    return node.value || node.val;
}
exports.value = value;
/**
 * Append `node.value` to `compiler.output`.
 *
 * ```js
 * snapdragon.compiler.set('text', utils.identity);
 * ```
 */
function identity(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    appendToCompiler(this, value(node), node);
}
exports.identity = identity;
/**
 * Previously named `.emit`, this method appends the given `value`
 * to `compiler.output` for the given node. Useful when you know
 * what value should be appended advance, regardless of the actual
 * value of `node.value`.
 *
 * ```js
 * snapdragon.compiler
 *   .set('i', function(node) {
 *     this.mapVisit(node);
 *   })
 *   .set('i.open', utils.append('<i>'))
 *   .set('i.close', utils.append('</i>'))
 * ```
 */
function append(value) {
    return function (node) {
        assertType(isNode(node), 'expected "node" to be an instance of Node');
        appendToCompiler(this, value, node);
    };
}
exports.append = append;
/**
 * Used in compiler middleware, this converts an AST node into
 * an empty `text` node and deletes `node.nodes` if it exists.
 * The advantage of this method is that, as opposed to completely
 * removing the node, indices will not need to be re-calculated
 * in sibling nodes, and nothing is appended to the output.
 *
 * ```js
 * utils.toNoop(node);
 * // convert `node.nodes` to the given value instead of deleting it
 * utils.toNoop(node, []);
 * ```
 */
function toNoop(node, nodes) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    if (nodes) {
        assertType(isArray(nodes), 'expected "nodes" to be an array');
        node.nodes = nodes;
    }
    else {
        delete node.nodes;
        node.type = 'text';
        node.value = '';
    }
}
exports.toNoop = toNoop;
/**
 * Visit `node` with the given `fn`. The built-in `.visit` method in snapdragon
 * automatically calls registered compilers, this allows you to pass a visitor
 * function.
 *
 * ```js
 * snapdragon.compiler.set('i', function(node) {
 *   utils.visit(node, function(childNode) {
 *     // do stuff with "childNode"
 *     return childNode;
 *   });
 * });
 * ```
 */
function visit(node, fn) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(fn), 'expected "fn" to be function');
    fn(node);
    return node.nodes ? mapVisit(node, fn) : node;
}
exports.visit = visit;
/**
 * Map [visit](#visit) the given `fn` over `node.nodes`. This is called by
 * [visit](#visit), use this method if you do not want `fn` to be called on
 * the first node.
 *
 * ```js
 * snapdragon.compiler.set('i', function(node) {
 *   utils.mapVisit(node, function(childNode) {
 *     // do stuff with "childNode"
 *     return childNode;
 *   });
 * });
 * ```
 */
function mapVisit(node, fn) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(fn), 'expected "fn" to be function');
    if (Array.isArray(node.nodes)) {
        for (const child of node.nodes) {
            visit(child, fn);
        }
    }
    else if (node.nodes !== undefined) {
        throw new TypeError('expected "node.nodes" to be an array');
    }
    return node;
}
exports.mapVisit = mapVisit;
function addOpen(node, Node, value, filter) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(Node), 'expected "Node" to be a constructor function');
    if (isFunction(value)) {
        filter = value;
        value = '';
    }
    if (isFunction(filter) && !filter(node))
        return;
    assertType(isString(node.type), 'expected "node.type" to be a string');
    const open = new Node({ type: node.type + '.open', value: value });
    unshiftNode(node, open);
    return open;
}
exports.addOpen = addOpen;
function addClose(node, Node, value, filter) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(Node), 'expected "Node" to be a constructor function');
    if (isFunction(value)) {
        filter = value;
        value = '';
    }
    if (isFunction(filter) && !filter(node))
        return;
    assertType(isString(node.type), 'expected "node.type" to be a string');
    const close = new Node({ type: node.type + '.close', value: value });
    pushNode(node, close);
    return close;
}
exports.addClose = addClose;
/**
 * Wraps the given `node` with `*.open` and `*.close` nodes.
 */
function wrapNodes(node, Node, filter) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(Node), 'expected "Node" to be a constructor function');
    addOpen(node, Node, filter);
    addClose(node, Node, filter);
    return node;
}
exports.wrapNodes = wrapNodes;
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
 */
function pushNode(parent, node) {
    assertType(isNode(parent), 'expected "parent" to be an instance of Node');
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    if (isFunction(parent.push)) {
        return parent.push(node);
    }
    else if (isFunction(parent.pushNode)) {
        return parent.pushNode(node);
    }
    else {
        assertType(isFunction(node.define), 'expected "node.define" to be a function');
        node.define('parent', parent);
        parent.nodes = parent.nodes || [];
        return parent.nodes.push(node);
    }
}
exports.pushNode = pushNode;
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
 */
function unshiftNode(parent, node) {
    assertType(isNode(parent), 'expected "parent" to be an instance of Node');
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    if (isFunction(parent.unshift)) {
        return parent.unshift(node);
    }
    else if (isFunction(parent.unshiftNode)) {
        return parent.unshiftNode(node);
    }
    else {
        assertType(isFunction(node.define), 'expected "node.define" to be a function');
        node.define('parent', parent);
        parent.nodes = parent.nodes || [];
        return parent.nodes.unshift(node);
    }
}
exports.unshiftNode = unshiftNode;
/**
 * Pop the last `node` off of `parent.nodes`. The advantage of
 * using this method is that it checks for `node.nodes` and works
 * with any version of `snapdragon-node`.
 *
 * ```js
 * var parent = new Node({type: 'foo'});
 * utils.pushNode(parent, new Node({type: 'foo'}));
 * utils.pushNode(parent, new Node({type: 'bar'}));
 * utils.pushNode(parent, new Node({type: 'baz'}));
 * console.log(parent.nodes.length); //=> 3
 * utils.popNode(parent);
 * console.log(parent.nodes.length); //=> 2
 * ```
 */
function popNode(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    if (isFunction(node.pop)) {
        return node.pop();
    }
    else {
        return (node.nodes && node.nodes.pop()) || null;
    }
}
exports.popNode = popNode;
/**
 * Shift the first `node` off of `parent.nodes`. The advantage of
 * using this method is that it checks for `node.nodes` and works
 * with any version of `snapdragon-node`.
 *
 * ```js
 * var parent = new Node({type: 'foo'});
 * utils.pushNode(parent, new Node({type: 'foo'}));
 * utils.pushNode(parent, new Node({type: 'bar'}));
 * utils.pushNode(parent, new Node({type: 'baz'}));
 * console.log(parent.nodes.length); //=> 3
 * utils.shiftNode(parent);
 * console.log(parent.nodes.length); //=> 2
 * ```
 */
function shiftNode(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    if (isFunction(node.shift)) {
        return node.shift();
    }
    else {
        return (node.nodes && node.nodes.shift()) || null;
    }
}
exports.shiftNode = shiftNode;
/**
 * Remove the specified `node` from `parent.nodes`.
 *
 * ```js
 * var parent = new Node({type: 'abc'});
 * var foo = new Node({type: 'foo'});
 * utils.pushNode(parent, foo);
 * utils.pushNode(parent, new Node({type: 'bar'}));
 * utils.pushNode(parent, new Node({type: 'baz'}));
 * console.log(parent.nodes.length); //=> 3
 * utils.removeNode(parent, foo);
 * console.log(parent.nodes.length); //=> 2
 * ```
 */
function removeNode(parent, node) {
    assertType(isNode(parent), 'expected "parent" to be an instance of Node');
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isArray(parent.nodes) || isUndefined(parent.nodes), 'expected "parent.nodes" to be an array');
    if (isFunction(parent.remove)) {
        return parent.remove(node);
    }
    else if (parent.nodes) {
        const idx = parent.nodes.indexOf(node);
        if (idx !== -1) {
            return parent.nodes.splice(idx, 1)[0];
        }
    }
    return null;
}
exports.removeNode = removeNode;
/**
 * Returns true if `node.type` matches the given `type`.
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var node = new Node({type: 'foo'});
 * console.log(utils.isType(node, 'foo')); // false
 * console.log(utils.isType(node, 'bar')); // true
 * ```
 */
function isType(node, type) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isString(node.type), 'expected "node.type" to be a string');
    switch (typeOf(type)) {
        case 'string':
            return node.type === type;
        case 'regexp':
            return type.test(node.type);
        case 'array':
            for (const key of type.slice()) {
                if (isType(node, key)) {
                    return true;
                }
            }
            return false;
        default: {
            throw new TypeError('expected "type" to be an array, string or regexp');
        }
    }
}
exports.isType = isType;
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
 */
function hasType(node, type) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    if (Array.isArray(node.nodes)) {
        for (const child of node.nodes) {
            if (isType(child, type)) {
                return true;
            }
        }
    }
    else if (!isUndefined(node.nodes)) {
        throw new TypeError('expected "node.nodes" to be an array');
    }
    return false;
}
exports.hasType = hasType;
/**
 * Returns the first node from `node.nodes` of the given `type`.
 *
 * ```js
 * var node = new Node({
 *   type: 'foo',
 *   nodes: [
 *     new Node({type: 'text', value: 'abc'}),
 *     new Node({type: 'text', value: 'xyz'})
 *   ]
 * });
 *
 * var textNode = utils.firstOfType(node.nodes, 'text');
 * console.log(textNode.value);
 * //=> 'abc'
 * ```
 */
function firstOfType(nodes, type) {
    assertType(isArray(nodes), 'expected "nodes" to be an array');
    for (const node of nodes) {
        if (isType(node, type)) {
            return node;
        }
    }
    return null;
}
exports.firstOfType = firstOfType;
/**
 * Returns the node at the specified index, or the first node of the
 * given `type` from `node.nodes`.
 *
 * ```js
 * var node = new Node({
 *   type: 'foo',
 *   nodes: [
 *     new Node({type: 'text', value: 'abc'}),
 *     new Node({type: 'text', value: 'xyz'})
 *   ]
 * });
 *
 * var nodeOne = utils.findNode(node.nodes, 'text');
 * console.log(nodeOne.value);
 * //=> 'abc'
 *
 * var nodeTwo = utils.findNode(node.nodes, 1);
 * console.log(nodeTwo.value);
 * //=> 'xyz'
 * ```
 */
function findNode(nodes, type) {
    assertType(isArray(nodes), 'expected "nodes" to be an array');
    if (isNumber(type)) {
        return nodes[type];
    }
    else {
        return firstOfType(nodes, type);
    }
}
exports.findNode = findNode;
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
 */
function isOpen(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    if (node.parent && isFunction(node.parent.isOpen)) {
        return node.parent.isOpen(node);
    }
    else if (node && isFunction(node.isOpen)) {
        return node.isOpen(node);
    }
    else {
        assertType(isString(node.type) || isUndefined(node.type), 'expected "node.type" to be a string');
        return node.type ? node.type.slice(-5) === '.open' : false;
    }
}
exports.isOpen = isOpen;
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
 */
function isClose(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    if (node.parent && isFunction(node.parent.isClose)) {
        return node.parent.isClose(node);
    }
    else if (node && isFunction(node.isClose)) {
        return node.isClose(node);
    }
    else {
        assertType(isString(node.type) || isUndefined(node.type), 'expected "node.type" to be a string');
        return node.type ? node.type.slice(-6) === '.close' : false;
    }
}
exports.isClose = isClose;
/**
 * Returns true if the given node is an "*.open" node.
 *
 * ```js
 * var Node = require('snapdragon-node');
 * var brace = new Node({type: 'brace'});
 * var open = new Node({type: 'brace.open', value: '{'});
 * var inner = new Node({type: 'text', value: 'a,b,c'});
 * var close = new Node({type: 'brace.close', value: '}'});
 * brace.push(open);
 * brace.push(inner);
 * brace.push(close);
 *
 * console.log(utils.isBlock(brace)); // true
 * ```
 */
function isBlock(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isArray(node.nodes) || isUndefined(node.nodes), 'expected "node.nodes" to be an array');
    if (node.parent && isFunction(node.parent.isBlock)) {
        return node.parent.isBlock(node);
    }
    else if (isFunction(node.isBlock)) {
        return node.isBlock(node);
    }
    else {
        return hasOpenAndClose(node);
    }
}
exports.isBlock = isBlock;
/**
 * Returns true if `parent.nodes` has the given `node`.
 *
 * ```js
 * const foo = new Node({type: 'foo'});
 * const bar = new Node({type: 'bar'});
 * console.log(util.hasNode(foo, bar)); // false
 * foo.push(bar);
 * console.log(util.hasNode(foo, bar)); // true
 * ```
 */
function hasNode(node, child) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isNode(child), 'expected "child" to be an instance of Node');
    if (isFunction(node.has)) {
        return node.has(child);
    }
    else if (node.nodes) {
        assertType(isArray(node.nodes), 'expected "node.nodes" to be an array');
        return node.nodes.indexOf(child) !== -1;
    }
    else {
        return false;
    }
}
exports.hasNode = hasNode;
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
 * brace.pushNode(open);
 * console.log(utils.hasOpen(brace)); // true
 * ```
 */
function hasOpen(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    let first = node.first || undefined;
    if (first === undefined) {
        assertType(isArray(node.nodes) || isUndefined(node.nodes), 'expected "node.nodes" to be an array');
        first = node.nodes ? node.nodes[0] : undefined;
        if (first === undefined)
            return false;
    }
    assertType(isNode(first), 'expected "first" to be an instance of Node');
    if (isFunction(node.isOpen)) {
        return node.isOpen(first);
    }
    else {
        return first.type === `${node.type}.open`;
    }
}
exports.hasOpen = hasOpen;
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
 * brace.pushNode(close);
 * console.log(utils.hasClose(brace)); // true
 * ```
 */
function hasClose(node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    let last = node.last || undefined;
    if (last === undefined) {
        assertType(isArray(node.nodes) || isUndefined(node.nodes), 'expected "node.nodes" to be an array');
        if (node.nodes) {
            const length = node.nodes.length;
            last = length > 0 ? node.nodes[length - 1] : undefined;
        }
        if (last === undefined)
            return false;
    }
    assertType(isNode(last), 'expected "first" to be an instance of Node');
    if (isFunction(node.isClose)) {
        return node.isClose(last);
    }
    else {
        return last.type === `${node.type}.close`;
    }
}
exports.hasClose = hasClose;
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
 * brace.pushNode(open);
 * brace.pushNode(close);
 * console.log(utils.hasOpen(brace)); // true
 * console.log(utils.hasClose(brace)); // true
 * ```
 */
function hasOpenAndClose(node) {
    return hasOpen(node) && hasClose(node);
}
exports.hasOpenAndClose = hasOpenAndClose;
/**
 * Push the given `node` onto the `state.inside` array for the
 * given type. This array is used as a specialized "stack" for
 * only the given `node.type`.
 *
 * ```js
 * var state = { inside: {}};
 * var node = new Node({type: 'brace'});
 * utils.addType(state, node);
 * console.log(state.inside);
 * //=> { brace: [{type: 'brace'}] }
 * ```
 */
function addType(state, node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isObject(state), 'expected "state" to be an object');
    let type = undefined;
    if (node.parent) {
        assertType(isNode(node.parent), 'expected "node.parent" to be an instance of Node');
        assertType(isString(node.parent.type), 'expected "node.parent.type" to be a string');
        type = node.parent.type;
    }
    else {
        assertType(isString(node.type), 'expected "node.type" to be a string');
        type = node.type.replace(/\.open$/, '');
    }
    if (!state.hasOwnProperty('inside')) {
        state.inside = {};
    }
    if (!state.inside.hasOwnProperty(type)) {
        state.inside[type] = [];
    }
    const arr = state.inside[type];
    arr.push(node);
    return arr;
}
exports.addType = addType;
;
/**
 * Remove the given `node` from the `state.inside` array for the
 * given type. This array is used as a specialized "stack" for
 * only the given `node.type`.
 *
 * ```js
 * var state = { inside: {}};
 * var node = new Node({type: 'brace'});
 * utils.addType(state, node);
 * console.log(state.inside);
 * //=> { brace: [{type: 'brace'}] }
 * utils.removeType(state, node);
 * //=> { brace: [] }
 * ```
 */
function removeType(state, node) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isObject(state), 'expected "state" to be an object');
    assertType(isObject(state.inside), 'expected "state.inside" to be an object');
    let type = undefined;
    if (node.parent) {
        assertType(isNode(node.parent), 'expected "node.parent" to be an instance of Node');
        assertType(isString(node.parent.type), 'expected "node.parent.type" to be a string');
        type = node.parent.type;
    }
    else {
        assertType(isString(node.type), 'expected "node.type" to be a string');
        type = node.type.replace(/\.open$/, '');
    }
    assertType(isObject(state.inside), 'expected "state.inside" to be an object');
    if (state.inside.hasOwnProperty(type)) {
        return state.inside[type].pop() || null;
    }
    return null;
}
exports.removeType = removeType;
/**
 * Returns true if `node.value` is an empty string, or `node.nodes` does
 * not contain any non-empty text nodes.
 *
 * ```js
 * var node = new Node({type: 'text'});
 * utils.isEmpty(node); //=> true
 * node.value = 'foo';
 * utils.isEmpty(node); //=> false
 * ```
 */
function isEmpty(node, fn) {
    assertType(isNode(node), 'expected node to be an instance of Node');
    assertType(isArray(node.nodes) || isUndefined(node.nodes), 'expected "node.nodes" to be an array');
    if (Array.isArray(node.nodes)) {
        for (const child of node.nodes) {
            if (!isEmpty(child, fn)) {
                return false;
            }
        }
        return true;
    }
    else {
        if (isFunction(fn)) {
            return fn(node);
        }
        return !value(node);
    }
}
exports.isEmpty = isEmpty;
/**
 * Returns true if the `state.inside` stack for the given type exists
 * and has one or more nodes on it.
 *
 * ```js
 * var state = { inside: {}};
 * var node = new Node({type: 'brace'});
 * console.log(utils.isInsideType(state, 'brace')); //=> false
 * utils.addType(state, node);
 * console.log(utils.isInsideType(state, 'brace')); //=> true
 * utils.removeType(state, node);
 * console.log(utils.isInsideType(state, 'brace')); //=> false
 * ```
 */
function isInsideType(state, type) {
    assertType(isObject(state), 'expected "state" to be an object');
    assertType(isString(type), 'expected "type" to be a string');
    if (state.hasOwnProperty('inside')) {
        if (state.inside.hasOwnProperty(type)) {
            return state.inside[type].length > 0;
        }
    }
    return false;
}
exports.isInsideType = isInsideType;
/**
 * Returns true if `node` is either a child or grand-child of the given `type`,
 * or `state.inside[type]` is a non-empty array.
 *
 * ```js
 * var state = { inside: {}};
 * var node = new Node({type: 'brace'});
 * var open = new Node({type: 'brace.open'});
 * console.log(utils.isInside(state, open, 'brace')); //=> false
 * utils.pushNode(node, open);
 * console.log(utils.isInside(state, open, 'brace')); //=> true
 * ```
 */
function isInside(state, node, type) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isObject(state), 'expected "state" to be an object');
    switch (typeOf(type)) {
        case 'string': {
            assertType(isUndefined(node.parent) || isNode(node.parent), 'expected "node.parent" to be an instance of Node');
            return (node.parent && node.parent.type === type) || isInsideType(state, type);
        }
        case 'regexp': {
            assertType(isUndefined(node.parent) || isNode(node.parent), 'expected "node.parent" to be an instance of Node');
            const parent = node.parent;
            if (parent && parent.type) {
                assertType(isString(parent.type), 'expected "node.parent.type" to be a string');
                if (type.test(parent.type)) {
                    return true;
                }
            }
            assertType(isObject(state.inside), 'expected "state.inside" to be an object');
            const keys = Object.keys(state.inside);
            for (const key of keys) {
                const value = state.inside[key];
                if (isArray(value) && value.length !== 0 && type.test(key)) {
                    return true;
                }
            }
            return false;
        }
        case 'array': {
            for (const child of type) {
                if (isInside(state, node, child)) {
                    return true;
                }
            }
            return false;
        }
        default: {
            throw new TypeError('expected "type" to be an array, string or regexp');
        }
    }
}
exports.isInside = isInside;
/**
 * Get the last `n` element from the given `array`. Used for getting
 * a node from `node.nodes`.
 */
function last(arr, n) {
    return (isArray(arr) && arr[arr.length - (n || 1)]) || null;
}
exports.last = last;
/**
 * Get the last node from `node.nodes`.
 */
function lastNode(node) {
    return (isArray(node.nodes) && last(node.nodes)) || null;
}
exports.lastNode = lastNode;
/**
 * Cast the given `value` to an array.
 *
 * ```js
 * console.log(utils.arrayify(''));
 * //=> []
 * console.log(utils.arrayify('foo'));
 * //=> ['foo']
 * console.log(utils.arrayify(['foo']));
 * //=> ['foo']
 * ```
 */
function arrayify(value) {
    if (isString(value) && value !== '') {
        return [value];
    }
    else if (!isArray(value)) {
        return [];
    }
    else {
        return value;
    }
}
exports.arrayify = arrayify;
/**
 * Convert the given `value` to a string by joining with `,`. Useful
 * for creating a cheerio/CSS/DOM-style selector from a list of strings.
 */
function stringify(value) {
    return arrayify(value).join(',');
}
exports.stringify = stringify;
/**
 * Ensure that the given value is a string and call `.trim()` on it,
 * or return an empty string.
 */
function trim(str) {
    return isString(str) ? str.trim() : '';
}
exports.trim = trim;
/**
 * Return true if value is an object
 */
function isObject(value) {
    return typeOf(value) === 'object';
}
/**
 * Return true if value is a string
 */
function isString(value) {
    return typeof value === 'string';
}
/**
 * Return true if value is a number
 */
function isNumber(value) {
    return typeof value === 'number';
}
/**
 * Return true if value is a function
 */
function isFunction(value) {
    return typeof value === 'function';
}
/**
 * Return true if value is undefined
 */
function isUndefined(value) {
    return value === undefined;
}
/**
 * Return true if value is an array
 */
function isArray(value) {
    return Array.isArray(value);
}
/**
 * Shim to ensure the `.append` methods work with any version of snapdragon
 */
function appendToCompiler(compiler, value, node) {
    if (typeof compiler.append !== 'function') {
        assertType(isFunction(compiler.emit), 'expected "compiler.emit" to be a function');
        return compiler.emit(value, node);
    }
    return compiler.append(value, node);
}
/**
 * Simplified assertion. Throws an error is `value` is falsey.
 */
function assertType(value, message) {
    if (!value)
        throw new TypeError(message);
}
