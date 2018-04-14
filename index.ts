const typeOf = require('kind-of');

/**
 * An interface that describes what structure is expected from Snapdragon's Node.
 */
export interface NodeLike {
    type?: string;
    value?: string;
    val?: string;
    parent?: NodeLike;
    nodes?: Array<NodeLike>;
    push?(node: NodeLike): number;
    pushNode?(node: NodeLike): number;
    unshift?(node: NodeLike): number;
    unshiftNode?(node: NodeLike): number;
    pop?(): NodeLike | null;
    shift?(): NodeLike | null;
    define?<K extends string, V>(name: K, val: V): this & { [key in K]: V };
    remove?(node: NodeLike): NodeLike | null;
    isOpen?(node: NodeLike): boolean;
    isClose?(node: NodeLike): boolean;
    isBlock?(node: NodeLike): boolean;
    has?(node: NodeLike): boolean;
    readonly first?: NodeLike | null;
    readonly last?: NodeLike | null;
}

/**
 * An interface that describes what constructor is expected from Snapdragon's Node.
 */
export interface NodeLikeConstructor {
    new(): NodeLike;
    new <T1 extends object, T2 extends NodeLike>(value: T1, parent?: T2): NodeLike & T1;
    new <T extends NodeLike>(value: string, type: string, parent?: T): NodeLike & { value: string, type: string };
}

/**
 * An interface that describes what structure is expected from Snapdragon's Compiler.
 */
export interface CompilerLike {
    append?(value: string, node: NodeLike): any | undefined;
    emit?(value: string, node: NodeLike): any | undefined;
}

/**
 * An interface that describes what object structure should be expected for State object.
 */
export interface StateLike {
    inside?: {
        [type: string]: NodeLike[]
    }
}

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
export function isNode<T extends object>(node: T): node is NodeLike & T {
    return isObject(node) && (node as T & { isNode: boolean }).isNode === true;
}

/**
 * Emit an empty string for the given `node`.
 *
 * ```js
 * // do nothing for beginning-of-string
 * snapdragon.compiler.set('bos', utils.noop);
 * ```
 */
export function noop(this: CompilerLike, node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    appendToCompiler(this, '', node);
}

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
export function value(node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    return node.value || node.val;
}

/**
 * Append `node.value` to `compiler.output`.
 *
 * ```js
 * snapdragon.compiler.set('text', utils.identity);
 * ```
 */
export function identity(this: CompilerLike, node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    appendToCompiler(this, value(node) as string, node);
}

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
export function append(value: string) {
    return function (this: CompilerLike, node: NodeLike) {
        assertType(isNode(node), 'expected "node" to be an instance of Node');

        appendToCompiler(this, value, node);
    };
}

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
export function toNoop(node: NodeLike, nodes?: Array<NodeLike>) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    if (nodes) {
        assertType(isArray(nodes), 'expected "nodes" to be an array');
        node.nodes = nodes;
    } else {
        delete node.nodes;
        (node as { type: string }).type = 'text';
        (node as { value: string }).value = '';
    }
}

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
export function visit(node: NodeLike, fn: (node: NodeLike) => void) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(fn), 'expected "fn" to be function');

    fn(node);

    return node.nodes ? mapVisit(node, fn) : node;
}

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
export function mapVisit(node: NodeLike, fn: (node: NodeLike) => void) {
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

/**
 * Unshift an `*.open` node onto `node.nodes`.
 *
 * ```js
 * var Node = require('snapdragon-node');
 * snapdragon.parser.set('brace', function(node) {
 *   var match = this.match(/^{/);
 *   if (match) {
 *     var parent = new Node({type: 'brace'});
 *     utils.addOpen(parent, Node);
 *     console.log(parent.nodes[0]):
 *     // { type: 'brace.open', value: '' };
 *
 *     // push the parent "brace" node onto the stack
 *     this.push(parent);
 *
 *     // return the parent node, so it's also added to the AST
 *     return brace;
 *   }
 * });
 * ```
 */
export function addOpen(node: NodeLike, Node: NodeLikeConstructor, filter?: (node: NodeLike) => boolean): NodeLike & { type: string, value: string | undefined };
export function addOpen(node: NodeLike, Node: NodeLikeConstructor, value?: string, filter?: (node: NodeLike) => boolean): NodeLike & { type: string, value: string | undefined };
export function addOpen(node: NodeLike, Node: NodeLikeConstructor, value?: string | ((node: NodeLike) => boolean), filter?: (node: NodeLike) => boolean) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(Node), 'expected "Node" to be a constructor function');

    if (isFunction(value)) {
        filter = value;
        value = '';
    }

    if (isFunction(filter) && !filter(node)) return;

    assertType(isString((node as any).type), 'expected "node.type" to be a string');

    const open = new Node({ type: (node as any).type + '.open', value: value });
    unshiftNode(node, open);

    return open;
}

/**
 * Push a `*.close` node onto `node.nodes`.
 *
 * ```js
 * var Node = require('snapdragon-node');
 * snapdragon.parser.set('brace', function(node) {
 *   var match = this.match(/^}/);
 *   if (match) {
 *     var parent = this.parent();
 *     if (parent.type !== 'brace') {
 *       throw new Error('missing opening: ' + '}');
 *     }
 *
 *     utils.addClose(parent, Node);
 *     console.log(parent.nodes[parent.nodes.length - 1]):
 *     // { type: 'brace.close', value: '' };
 *
 *     // no need to return a node, since the parent
 *     // was already added to the AST
 *     return;
 *   }
 * });
 * ```
 */
export function addClose(node: NodeLike, Node: NodeLikeConstructor, filter?: (node: NodeLike) => boolean): NodeLike & { type: string, value: string | undefined };
export function addClose(node: NodeLike, Node: NodeLikeConstructor, value?: string, filter?: (node: NodeLike) => boolean): NodeLike & { type: string, value: string | undefined };
export function addClose(node: NodeLike, Node: NodeLikeConstructor, value?: string | ((node: NodeLike) => boolean), filter?: (node: NodeLike) => boolean) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(Node), 'expected "Node" to be a constructor function');

    if (isFunction(value)) {
        filter = value;
        value = '';
    }

    if (isFunction(filter) && !filter(node)) return;

    assertType(isString((node as any).type), 'expected "node.type" to be a string');

    const close = new Node({ type: (node as any).type + '.close', value: value });
    pushNode(node, close);

    return close;
}

/**
 * Wraps the given `node` with `*.open` and `*.close` nodes.
 */
export function wrapNodes(node: NodeLike, Node: NodeLikeConstructor, filter?: (node: NodeLike) => boolean) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isFunction(Node), 'expected "Node" to be a constructor function');

    addOpen(node, Node, filter);
    addClose(node, Node, filter);

    return node;
}

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
export function pushNode(parent: NodeLike, node: NodeLike) {
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

        (node as any).define('parent', parent);
        parent.nodes = parent.nodes || [];

        return parent.nodes.push(node);
    }
}

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
export function unshiftNode(parent: NodeLike, node: NodeLike) {
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

        (node as any).define('parent', parent);
        parent.nodes = parent.nodes || [];

        return parent.nodes.unshift(node);
    }
}

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
export function popNode(node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    if (isFunction(node.pop)) {
        return node.pop();
    }
    else {
        return (node.nodes && node.nodes.pop()) || null;
    }
}

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
export function shiftNode(node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    if (isFunction(node.shift)) {
        return node.shift();
    }
    else {
        return (node.nodes && node.nodes.shift()) || null;
    }
}

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
export function removeNode(parent: NodeLike, node: NodeLike) {
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
export function isType(node: NodeLike, type: string | RegExp | string[]) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isString((node as any).type), 'expected "node.type" to be a string');

    switch (typeOf(type)) {
        case 'string':
            return ((node as any).type as string) === type as string;
        case 'regexp':
            return (type as RegExp).test((node as any).type as string);
        case 'array':
            for (const key of (type as string[]).slice()) {
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
export function hasType(node: NodeLike, type: string | RegExp | string[]) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    if (Array.isArray(node.nodes)) {
        for (const child of node.nodes) {
            if (isType(child, type)) {
                return true;
            }
        }
    } else if (!isUndefined(node.nodes)) {
        throw new TypeError('expected "node.nodes" to be an array');
    }

    return false;
}

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
export function firstOfType(nodes: NodeLike[], type: string | RegExp | string[]) {
    assertType(isArray(nodes), 'expected "nodes" to be an array');

    for (const node of nodes) {
        if (isType(node, type)) {
            return node;
        }
    }

    return null;
}

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
export function findNode(nodes: NodeLike[], type: number | string | RegExp | string[]) {
    assertType(isArray(nodes), 'expected "nodes" to be an array');

    if (isNumber(type)) {
        return nodes[type];
    }
    else {
        return firstOfType(nodes, type);
    }
}

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
export function isOpen(node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    if (node.parent && isFunction(node.parent.isOpen)) {
        return node.parent.isOpen(node);
    }
    else if (node && isFunction(node.isOpen)) {
        return node.isOpen(node);
    }
    else {
        assertType(isString((node as any).type) || isUndefined((node as any).type), 'expected "node.type" to be a string');

        return (node as any).type ? (node as any).type.slice(-5) === '.open' : false;
    }
}

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
export function isClose(node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    if (node.parent && isFunction(node.parent.isClose)) {
        return node.parent.isClose(node);
    }
    else if (node && isFunction(node.isClose)) {
        return node.isClose(node);
    }
    else {
        assertType(isString((node as any).type) || isUndefined((node as any).type), 'expected "node.type" to be a string');

        return (node as any).type ? (node as any).type.slice(-6) === '.close' : false;
    }
}

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
export function isBlock(node: NodeLike) {
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
export function hasNode(node: NodeLike, child: NodeLike) {
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
export function hasOpen(node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    let first = node.first || undefined;

    if (first === undefined) {
        assertType(isArray(node.nodes) || isUndefined(node.nodes), 'expected "node.nodes" to be an array');

        first = node.nodes ? node.nodes[0] : undefined;
        if (first === undefined) return false;
    }

    assertType(isNode(first), 'expected "first" to be an instance of Node');

    if (isFunction(node.isOpen)) {
        return node.isOpen(first);
    }
    else {
        return (first as any).type === `${(node as any).type}.open`;
    }
}

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
export function hasClose(node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');

    let last = node.last || undefined;

    if (last === undefined) {
        assertType(isArray(node.nodes) || isUndefined(node.nodes), 'expected "node.nodes" to be an array');

        if (node.nodes) {
            const length = node.nodes.length;
            last = length > 0 ? node.nodes[length - 1] : undefined;
        }

        if (last === undefined) return false;
    }

    assertType(isNode(last), 'expected "first" to be an instance of Node');

    if (isFunction(node.isClose)) {
        return node.isClose(last);
    }
    else {
        return (last as any).type === `${(node as any).type}.close`;
    }
}

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
export function hasOpenAndClose(node: NodeLike) {
    return hasOpen(node) && hasClose(node);
}

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
export function addType(state: StateLike, node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isObject(state), 'expected "state" to be an object');

    let type: string | undefined | null = undefined;

    if (node.parent) {
        assertType(isNode(node.parent), 'expected "node.parent" to be an instance of Node');
        assertType(isString((node.parent as any).type), 'expected "node.parent.type" to be a string');

        type = (node.parent as any).type;
    }
    else {
        assertType(isString((node as any).type), 'expected "node.type" to be a string');

        type = ((node as any).type as string).replace(/\.open$/, '');
    }

    if (!state.hasOwnProperty('inside')) {
        state.inside = {};
    }
    if (!(state.inside as any).hasOwnProperty(type as string)) {
        (state.inside as any)[type as string] = [];
    }

    const arr = (state.inside as any)[type as string] as NodeLike[];
    arr.push(node);
    return arr;
};

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
export function removeType(state: StateLike, node: NodeLike) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isObject(state), 'expected "state" to be an object');
    assertType(isObject(state.inside), 'expected "state.inside" to be an object');

    let type: string | undefined | null = undefined;

    if (node.parent) {
        assertType(isNode(node.parent), 'expected "node.parent" to be an instance of Node');
        assertType(isString((node.parent as any).type), 'expected "node.parent.type" to be a string');

        type = (node.parent as any).type;
    }
    else {
        assertType(isString((node as any).type), 'expected "node.type" to be a string');

        type = ((node as any).type as string).replace(/\.open$/, '');
    }

    assertType(isObject(state.inside), 'expected "state.inside" to be an object');

    if ((state.inside as any).hasOwnProperty(type)) {
        return ((state.inside as any)[type as string] as NodeLike[]).pop() || null;
    }

    return null;
}
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
export function isEmpty(node: NodeLike, fn?: (node: NodeLike) => boolean) {
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
export function isInsideType(state: StateLike, type: string) {
    assertType(isObject(state), 'expected "state" to be an object');
    assertType(isString(type), 'expected "type" to be a string');

    if (state.hasOwnProperty('inside')) {
        if ((state.inside as any).hasOwnProperty(type)) {
            return (state.inside as any)[type].length > 0;
        }
    }

    return false;
}

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
export function isInside(state: StateLike, node: NodeLike, type: string | RegExp | string[]) {
    assertType(isNode(node), 'expected "node" to be an instance of Node');
    assertType(isObject(state), 'expected "state" to be an object');

    switch (typeOf(type)) {
        case 'string': {
            assertType(isUndefined(node.parent) || isNode(node.parent), 'expected "node.parent" to be an instance of Node');

            return (node.parent && (node.parent as any).type === type) || isInsideType(state, type as string);
        }
        case 'regexp': {
            assertType(isUndefined(node.parent) || isNode(node.parent), 'expected "node.parent" to be an instance of Node');

            const parent = node.parent;

            if (parent && (parent as any).type) {
                assertType(isString((parent as any).type), 'expected "node.parent.type" to be a string');

                if ((type as RegExp).test((parent as any).type)) {
                    return true;
                }
            }

            assertType(isObject(state.inside), 'expected "state.inside" to be an object');

            const keys = Object.keys(state.inside as any);
            for (const key of keys) {
                const value = (state.inside as any)[key];

                if (isArray(value) && value.length !== 0 && (type as RegExp).test(key)) {
                    return true;
                }
            }
            return false;
        }
        case 'array': {
            for (const child of (type as string[])) {
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

/**
 * Get the last `n` element from the given `array`. Used for getting
 * a node from `node.nodes`.
 */
export function last<T>(arr: T[], n?: number) {
    return (isArray(arr) && arr[arr.length - (n || 1)] as T) || null;
}

/**
 * Get the last node from `node.nodes`.
 */
export function lastNode(node: NodeLike) {
    return (isArray(node.nodes) && last(node.nodes)) || null;
}

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
export function arrayify<T>(value: T) {
    if (isString(value) && value !== '') {
        return [value as string];
    }
    else if (!isArray(value)) {
        return [];
    }
    else {
        return value as T;
    }
}

/**
 * Convert the given `value` to a string by joining with `,`. Useful
 * for creating a cheerio/CSS/DOM-style selector from a list of strings.
 */
export function stringify<T>(value: T) {
    return (arrayify(value) as string[]).join(',');
}

/**
 * Ensure that the given value is a string and call `.trim()` on it,
 * or return an empty string.
 */
export function trim(str: string) {
    return isString(str) ? str.trim() : '';
}

/**
 * Return true if value is an object
 */

function isObject(value: any): value is object {
    return typeOf(value) === 'object';
}

/**
 * Return true if value is a string
 */

function isString(value: any): value is string {
    return typeof value === 'string';
}

/**
 * Return true if value is a number
 */

function isNumber(value: any): value is number {
    return typeof value === 'number';
}

/**
 * Return true if value is a function
 */

function isFunction(value: any): value is Function {
    return typeof value === 'function';
}

/**
 * Return true if value is undefined
 */

function isUndefined(value: any): value is undefined {
    return value === undefined;
}

/**
 * Return true if value is an array
 */

function isArray<T>(value: T): value is Array<T> & T {
    return Array.isArray(value);
}

/**
 * Shim to ensure the `.append` methods work with any version of snapdragon
 */

function appendToCompiler(compiler: CompilerLike, value: string, node: NodeLike) {
    if (typeof compiler.append !== 'function') {
        assertType(isFunction(compiler.emit), 'expected "compiler.emit" to be a function');

        return (compiler as any).emit(value, node);
    }
    return compiler.append(value, node);
}

/**
 * Simplified assertion. Throws an error is `value` is falsey.
 */

function assertType(value: boolean, message: string) {
    if (!value) throw new TypeError(message);
}
