/**
 * An interface that describes what structure is expected from Snapdragon's Node.
 */
export interface NodeLike<T> {
    isNode?: boolean;
    value?: string;
    val?: string;
    type?: string;
    parent?: NodeLike<T>;
    nodes?: NodeLike<T>[];
    push?: (node: NodeLike<T>) => number;
    pushNode?: (node: NodeLike<T>) => number;
    unshift?: (node: NodeLike<T>) => number;
    unshiftNode?: (node: NodeLike<T>) => number;
    pop?: () => NodeLike<T> | undefined;
    shift?: () => NodeLike<T> | undefined;
    define?: <K extends string, V>(name: K, val: V) => (this & {
        [key in K]: V;
    });
    remove?: (node: NodeLike<T>) => NodeLike<T> | undefined;
    isOpen?: (node: NodeLike<T>) => boolean;
    isClose?: (node: NodeLike<T>) => boolean;
    isBlock?: (node: NodeLike<T>) => boolean;
    has?: (node: NodeLike<T>) => boolean;
    readonly first?: NodeLike<T>;
    readonly last?: NodeLike<T>;
}
/**
 * An interface that describes what constructor is expected from Snapdragon's Node.
 */
export interface NodeLikeConstructor<T> {
    new (value: object, parent?: NodeLike<T>): NodeLike<T>;
    new (value: string, type: string, parent?: NodeLike<T>): NodeLike<T>;
}
/**
 * An interface that describes what structure is expected from Snapdragon's Compiler.
 */
export interface CompilerLike<T> {
    append?: (value: string, node: NodeLike<T>) => any | undefined;
    emit?: (value: string, node: NodeLike<T>) => any | undefined;
}
/**
 * An interface that describes what object structure should be expected for State object.
 */
export interface StateLike<T> {
    inside?: {
        [type: string]: NodeLike<T>[];
    };
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
export declare function isNode<T>(node: T): node is NodeLike<T> & T;
/**
 * Emit an empty string for the given `node`.
 *
 * ```js
 * // do nothing for beginning-of-string
 * snapdragon.compiler.set('bos', utils.noop);
 * ```
 */
export declare function noop<T>(this: CompilerLike<T>, node: NodeLike<T>): void;
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
export declare function value<T>(node: NodeLike<T>): string | undefined;
/**
 * Append `node.value` to `compiler.output`.
 *
 * ```js
 * snapdragon.compiler.set('text', utils.identity);
 * ```
 */
export declare function identity<T>(this: CompilerLike<T>, node: NodeLike<T>): void;
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
export declare function append(value: string): <T>(this: CompilerLike<T>, node: NodeLike<T>) => void;
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
export declare function toNoop<T>(node: NodeLike<T>, nodes?: Array<NodeLike<T>>): void;
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
export declare function visit<T>(node: NodeLike<T>, fn: (node: NodeLike<T>) => void): NodeLike<T>;
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
export declare function mapVisit<T>(node: NodeLike<T>, fn: (node: NodeLike<T>) => void): NodeLike<T>;
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
export declare function addOpen<T>(node: NodeLike<T>, Node: NodeLikeConstructor<T>, filter?: (node: NodeLike<T>) => boolean): NodeLike<T>;
export declare function addOpen<T>(node: NodeLike<T>, Node: NodeLikeConstructor<T>, value?: string, filter?: (node: NodeLike<T>) => boolean): NodeLike<T>;
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
export declare function addClose<T>(node: NodeLike<T>, Node: NodeLikeConstructor<T>, filter?: (node: NodeLike<T>) => boolean): NodeLike<T>;
export declare function addClose<T>(node: NodeLike<T>, Node: NodeLikeConstructor<T>, value?: string, filter?: (node: NodeLike<T>) => boolean): NodeLike<T>;
/**
 * Wraps the given `node` with `*.open` and `*.close` nodes.
 */
export declare function wrapNodes<T>(node: NodeLike<T>, Node: NodeLikeConstructor<T>, filter?: (node: NodeLike<T>) => boolean): NodeLike<T>;
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
export declare function pushNode<T>(parent: NodeLike<T>, node: NodeLike<T>): number;
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
export declare function unshiftNode<T>(parent: NodeLike<T>, node: NodeLike<T>): number;
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
export declare function popNode<T>(node: NodeLike<T>): NodeLike<T> | undefined;
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
export declare function shiftNode<T>(node: NodeLike<T>): NodeLike<T> | undefined;
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
export declare function removeNode<T>(parent: NodeLike<T>, node: NodeLike<T>): NodeLike<T> | undefined;
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
export declare function isType<T>(node: NodeLike<T>, type: string | RegExp | string[]): boolean;
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
export declare function hasType<T>(node: NodeLike<T>, type: string | RegExp | string[]): boolean;
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
export declare function firstOfType<T>(nodes: NodeLike<T>[], type: string | RegExp | string[]): NodeLike<T> | undefined;
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
export declare function findNode<T>(nodes: NodeLike<T>[], type: number | string | RegExp | string[]): NodeLike<T> | undefined;
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
export declare function isOpen<T>(node: NodeLike<T>): boolean;
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
export declare function isClose<T>(node: NodeLike<T>): boolean;
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
export declare function isBlock<T>(node: NodeLike<T>): boolean;
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
export declare function hasNode<T>(node: NodeLike<T>, child: NodeLike<T>): boolean;
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
export declare function hasOpen<T>(node: NodeLike<T>): boolean;
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
export declare function hasClose<T>(node: NodeLike<T>): boolean;
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
export declare function hasOpenAndClose<T>(node: NodeLike<T>): boolean;
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
export declare function addType<T>(state: StateLike<T>, node: NodeLike<T>): NodeLike<T>[];
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
export declare function removeType<T>(state: StateLike<T>, node: NodeLike<T>): NodeLike<T> | undefined;
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
export declare function isEmpty<T>(node: NodeLike<T>, fn?: (node: NodeLike<T>) => boolean): boolean;
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
export declare function isInsideType<T>(state: StateLike<T>, type: string): boolean;
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
export declare function isInside<T>(state: StateLike<T>, node: NodeLike<T>, type: string | RegExp | string[]): boolean;
/**
 * Get the last `n` element from the given `array`. Used for getting
 * a node from `node.nodes`.
 */
export declare function last<T>(arr: T, n?: number): T | undefined;
/**
 * Get the last node from `node.nodes`.
 */
export declare function lastNode<T>(node: NodeLike<T>): NodeLike<T> | undefined;
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
export declare function arrayify<T>(value: T): string[] | T;
/**
 * Convert the given `value` to a string by joining with `,`. Useful
 * for creating a cheerio/CSS/DOM-style selector from a list of strings.
 */
export declare function stringify<T>(value: T): string;
/**
 * Ensure that the given value is a string and call `.trim()` on it,
 * or return an empty string.
 */
export declare function trim(str: string): string;
