/**
 * An interface that describes what structure is expected from Snapdragon's Node.
 */
declare interface NodeLike<T> {
    /**
     * Property that is always present and true in Node.
     */
    readonly isNode: boolean;

    /**
     * [Optional] Value property.
     */
    //TODO: Which one is default or legacy?
    value?: string;

    /**
     * Value property.
     */
    //TODO: Which one is default or legacy?
    val: string;

    /**
     * [Optional] Node's children.
     */
    nodes?: NodeLike<T>[];

    /**
     * [Optional] Parent node.
     */
    parent?: NodeLike<T>;

    /**
     * Type property.
     */
    type: string;

    /**
     * [Optional] Unshift node to children node array (`this.nodes`).
     */
    unshift?: (node: NodeLike<T>) => number;

    /**
     * [Optional] Unshift node to children node array (`this.nodes`).
     */
    //TODO: Is this a legacy? Should it be removed?
    unshiftNode?: (node: NodeLike<T>) => number;

    /**
     * [Optional] Push node to children node array (`this.nodes`).
     */
    push?: (node: NodeLike<T>) => number;

    /**
     * [Optional] Push node to children node array (`this.nodes`).
     */
    //TODO: Is this a legacy? Should it be removed?
    pushNode?: (node: NodeLike<T>) => number;

    /**
     * [Optional] Pop node from children node array (`this.nodes`).
     */
    pop?: () => NodeLike<T> | undefined;

    /**
     * [Optional] Shift node from children node array (`this.nodes`).
     */
    shift?: () => NodeLike<T> | undefined;

    /**
     * [Optional] Shift node from children node array (`this.nodes`).
     */
    //TODO: Why null? Can't we skip index check and return empty array instead like it is supposed to happen?
    remove?: (node: NodeLike<T>) => NodeLike<T>[] | null;

    /**
     * [Optional] Returns true if type matches `*.open` pattern.
     */
    //TODO: Check `utils.isOpen`.
    isOpen?: () => boolean;

    /**
     * [Optional] Returns true if type matches `*.close` pattern.
     */
    //TODO: Check `utils.isClose`.
    isClose?: () => boolean;

    /**
     * [Optional] Returns true if node is block.
     */
    //TODO: Check `utils.isBlock`.
    isBlock?: () => boolean;

    /**
     * [Optional] Returns true if `node` exists in `this.nodes`.
     */
    has?: (node: NodeLike<T>) => boolean;

    /**
     * [Optional] Getter that returns first child node.
     */
    //TODO: Can be undefined and null. Why not stick to undefined?
    readonly first: NodeLike<T> | undefined | null;

    /**
     * [Optional] Getter that returns last child node.
     */
    //TODO: Can be undefined and null. Why not stick to undefined?
    readonly last: NodeLike<T> | undefined | null;
}

/**
 * An interface that describes what constructor is expected from Snapdragon's Node.
 */
declare interface NodeLikeConstructor<T> {
    //TODO: What are the correct values for `val`?
    new(val: { type: string, val?: string, value?: string } | string, type?: string, parent?: NodeLike<T>): NodeLike<T>;
}

/**
 * An interface that describes what object structure should be expected for State object.
 */
declare interface StateLike<T> {
    inside?: {
        [type: string]: NodeLike<T>[]
    }
}

/**
 * An interface that describes what object structure must be for State object.
 */
declare interface State<T> {
    inside: {
        [type: string]: NodeLike<T>[]
    }
}

/**
 * Returns true if the given value is a node.
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
 * var node = new Node({type: 'foo'});
 * console.log(utils.isNode(node)); //=> true
 * console.log(utils.isNode({})); //=> false
 * ```
 */

//TODO(self): Just return boolean?
export function isNode<T>(node: NodeLike<T>): node is NodeLike<T>;

/**
 * Emit an empty string for the given `node`.
 *
 * ```ts
 * // do nothing for beginning-of-string
 * snapdragon.compiler.set('bos', utils.noop);
 * ```
 */

export function noop<T>(node: NodeLike<T>): void;

/**
 * Returns `node.value` or `node.val`.
 *
 * ```ts
 * const star = new Node({type: 'star', value: '*'});
 * const slash = new Node({type: 'slash', val: '/'});
 * console.log(utils.value(star)) //=> '*'
 * console.log(utils.value(slash)) //=> '/'
 * ```
 */

//TODO: It is possible to get an undefined value. Is it supposed to be this way?
export function value<T>(node: NodeLike<T>): string | undefined;

/**
 * Append `node.value` to `compiler.output`.
 *
 * ```ts
 * snapdragon.compiler.set('text', utils.identity);
 * ```
 */

export function identity<T>(node: NodeLike<T>): void;

/**
 * Previously named `.emit`, this method appends the given `value`
 * to `compiler.output` for the given node. Useful when you know
 * what value should be appended in advance, regardless of the actual
 * value of `node.value`.
 *
 * ```ts
 * snapdragon.compiler
 *   .set('i', function(node) {
 *     this.mapVisit(node);
 *   })
 *   .set('i.open', utils.append('<i>'))
 *   .set('i.close', utils.append('</i>'))
 * ```
 */

export function append<T>(value: string): (node: NodeLike<T>) => void;

/**
 * Used in compiler middleware, this converts an AST node into
 * an empty `text` node and deletes `node.nodes` if it exists.
 * The advantage of this method is that, as opposed to completely
 * removing the node, indices will not need to be re-calculated
 * in sibling nodes, and nothing is appended to the output.
 *
 * ```ts
 * utils.toNoop(node);
 * // convert `node.nodes` to the given value instead of deleting it
 * utils.toNoop(node, []);
 * ```
 */

export function toNoop<T>(node: NodeLike<T>, nodes?: NodeLike<T>[]): void;

/**
 * Visit `node` with the given `fn`. The built-in `.visit` method in snapdragon
 * automatically calls registered compilers, this allows you to pass a visitor
 * function.
 *
 * ```ts
 * snapdragon.compiler.set('i', function(node) {
 *   utils.visit(node, function(childNode) {
 *     // do stuff with "childNode"
 *   });
 * });
 * ```
 */

export function visit<T>(node: NodeLike<T>, fn: (node: NodeLike<T>) => void): NodeLike<T>;

/**
 * Map [visit](#visit) the given `fn` over `node.nodes`. This is called by
 * [visit](#visit), use this method if you do not want `fn` to be called on
 * the first node.
 *
 * ```ts
 * snapdragon.compiler.set('i', function(node) {
 *   utils.mapVisit(node, function(childNode) {
 *     // do stuff with "childNode"
 *   });
 * });
 * ```
 */

export function mapVisit<T>(node: NodeLike<T>, fn: NodeLike<T>): NodeLike<T>;

/**
 * Unshift an `*.open` node onto `node.nodes`.
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
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

export function addOpen<T>(
    node: NodeLike<T>,
    Node: NodeLikeConstructor<T>,
    value: string | ((node: NodeLike<T>) => boolean),
    filter?: (node: NodeLike<T>) => boolean
): NodeLike<T> | undefined;

/**
 * Push a `*.close` node onto `node.nodes`.
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
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

export function addClose<T>(node: NodeLike<T>,
    Node: NodeLikeConstructor<T>,
    value: string | ((node: NodeLike<T>) => boolean),
    filter?: (node: NodeLike<T>) => boolean
): NodeLike<T> | undefined;

/**
 * Wraps the given `node` with `*.open` and `*.close` nodes.
 */

export function wrapNodes<T>(node: NodeLike<T>, Node: NodeLikeConstructor<T>, filter: (node: NodeLike<T>) => boolean): NodeLike<T>;

/**
 * Push the given `node` onto `parent.nodes`, and set `parent` as `node.parent.
 *
 * ```ts
 * var parent = new Node({type: 'foo'});
 * var node = new Node({type: 'bar'});
 * utils.pushNode(parent, node);
 * console.log(parent.nodes[0].type) // 'bar'
 * console.log(node.parent.type) // 'foo'
 * ```
 */

//TODO: What should really return? A bug maybe? Also, should it return undefined? Can we not throw an error?
export function pushNode<T>(parent: NodeLike<T>, node: NodeLike<T>): NodeLike<T> | number | undefined;

/**
 * Unshift `node` onto `parent.nodes`, and set `parent` as `node.parent.
 *
 * ```ts
 * var parent = new Node({type: 'foo'});
 * var node = new Node({type: 'bar'});
 * utils.unshiftNode(parent, node);
 * console.log(parent.nodes[0].type) // 'bar'
 * console.log(node.parent.type) // 'foo'
 * ```
 */

//TODO: What should really return? See `pushNode` + missing return?
export function unshiftNode<T>(parent: NodeLike<T>, node: NodeLike<T>): number | undefined;

/**
 * Pop the last `node` off of `parent.nodes`. The advantage of
 * using this method is that it checks for `node.nodes` and works
 * with any version of `snapdragon-node`.
 *
 * ```ts
 * var parent = new Node({type: 'foo'});
 * utils.pushNode(parent, new Node({type: 'foo'}));
 * utils.pushNode(parent, new Node({type: 'bar'}));
 * utils.pushNode(parent, new Node({type: 'baz'}));
 * console.log(parent.nodes.length); //=> 3
 * utils.popNode(parent);
 * console.log(parent.nodes.length); //=> 2
 * ```
 */

export function popNode<T>(node: NodeLike<T>): NodeLike<T> | undefined;

/**
 * Shift the first `node` off of `parent.nodes`. The advantage of
 * using this method is that it checks for `node.nodes` and works
 * with any version of `snapdragon-node`.
 *
 * ```ts
 * var parent = new Node({type: 'foo'});
 * utils.pushNode(parent, new Node({type: 'foo'}));
 * utils.pushNode(parent, new Node({type: 'bar'}));
 * utils.pushNode(parent, new Node({type: 'baz'}));
 * console.log(parent.nodes.length); //=> 3
 * utils.shiftNode(parent);
 * console.log(parent.nodes.length); //=> 2
 * ```
 */

export function shiftNode<T>(node: NodeLike<T>): NodeLike<T> | undefined;

/**
 * Remove the specified `node` from `parent.nodes`.
 *
 * ```ts
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

//TODO: Same as `NodeLike<T>.remove` method. We should return empty array instead of undefined and null?
export function removeNode<T>(parent: NodeLike<T>, node: NodeLike<T>): NodeLike<T>[] | null | undefined;

/**
 * Returns true if `node.type` matches the given `type`. Throws a
 * `TypeError` if `node` is not an instance of `Node`.
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
 * var node = new Node({type: 'foo'});
 * console.log(utils.isType(node, 'foo')); // false
 * console.log(utils.isType(node, 'bar')); // true
 * ```
 */

export function isType<T>(node: NodeLike<T>, type: string): boolean

/**
 * Returns true if the given `node` has the given `type` in `node.nodes`.
 * Throws a `TypeError` if `node` is not an instance of `Node`.
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
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

export function hasType<T>(node: NodeLike<T>, type: string): boolean;

/**
 * Returns the first node from `node.nodes` of the given `type`
 *
 * ```ts
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

export function firstOfType<T>(nodes: NodeLike<T>[], type: string): NodeLike<T> | undefined;

/**
 * Returns the node at the specified index, or the first node of the
 * given `type` from `node.nodes`.
 *
 * ```ts
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

export function findNode<T>(nodes: NodeLike<T>[], type: string | number): NodeLike<T> | undefined;

/**
 * Returns true if the given node is an "*.open" node.
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
 * var brace = new Node({type: 'brace'});
 * var open = new Node({type: 'brace.open'});
 * var close = new Node({type: 'brace.close'});
 *
 * console.log(utils.isOpen(brace)); // false
 * console.log(utils.isOpen(open)); // true
 * console.log(utils.isOpen(close)); // false
 * ```
 */

//TODO: Why does `node.isOpen` and `node.parent.isOpen` method requires `node`? It makes no sense? Why is parent even checked at all?
export function isOpen<T>(node: NodeLike<T>): boolean;

/**
 * Returns true if the given node is a "*.close" node.
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
 * var brace = new Node({type: 'brace'});
 * var open = new Node({type: 'brace.open'});
 * var close = new Node({type: 'brace.close'});
 *
 * console.log(utils.isClose(brace)); // false
 * console.log(utils.isClose(open)); // false
 * console.log(utils.isClose(close)); // true
 * ```
 */

//TODO: Why does `node.isClose` and `node.parent.isClose` method requires `node`? It makes no sense? Why is parent even checked at all?
export function isClose<T>(node: NodeLike<T>): boolean;

/**
 * Returns true if the given node is an "*.open" node.
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
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

//TODO: Why does `node.isBlock` and `node.parent.isBlock` method requires `node`? It makes no sense? Why is parent even checked at all?
export function isBlock<T>(node: NodeLike<T>): boolean;

/**
 * Returns true if `parent.nodes` has the given `node`.
 *
 * ```ts
 * const foo = new Node({type: 'foo'});
 * const bar = new Node({type: 'bar'});
 * cosole.log(util.hasNode(foo, bar)); // false
 * foo.push(bar);
 * cosole.log(util.hasNode(foo, bar)); // true
 * ```
 */

//TODO: Why does `node.isBlock` and `node.parent.isBlock` method requires `node`? It makes no sense? Why is parent even checked at all?
export function hasNode<T>(node: NodeLike<T>, child: NodeLike<T>): boolean;

/**
 * Returns true if `node.nodes` **has** an `.open` node
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
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

//TODO: Same as `util.isOpen`
export function hasOpen<T>(node: NodeLike<T>): boolean;

/**
 * Returns true if `node.nodes` **has** a `.close` node
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
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

//TODO: Same as `util.isClose`
export function hasClose<T>(node: NodeLike<T>): boolean;

/**
 * Returns true if `node.nodes` has both `.open` and `.close` nodes
 *
 * ```ts
 * import * as Node from 'snapdragon-node';
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

export function hasOpenAndClose<T>(node: NodeLike<T>): boolean;

/**
 * Push the given `node` onto the `state.inside` array for the
 * given type. This array is used as a specialized "stack" for
 * only the given `node.type`.
 *
 * ```ts
 * var state = { inside: {}};
 * var node = new Node({type: 'brace'});
 * utils.addType(state, node);
 * console.log(state.inside);
 * //=> { brace: [{type: 'brace'}] }
 * ```
 */


export function addType<T>(state: StateLike<T>, node: NodeLike<T>): NodeLike<T>[];

/**
 * Remove the given `node` from the `state.inside` array for the
 * given type. This array is used as a specialized "stack" for
 * only the given `node.type`.
 *
 * ```ts
 * var state = { inside: {}};
 * var node = new Node({type: 'brace'});
 * utils.addType(state, node);
 * console.log(state.inside);
 * //=> { brace: [{type: 'brace'}] }
 * utils.removeType(state, node);
 * //=> { brace: [] }
 * ```
 */

//What should it really return? It's also possible that `inside` is not defined.
export function removeType<T>(state: State<T>, node: NodeLike<T>): NodeLike<T> | undefined;

/**
 * Returns true if `node.value` is an empty string, or `node.nodes` does
 * not contain any non-empty text nodes.
 *
 * ```ts
 * var node = new Node({type: 'text'});
 * utils.isEmpty(node); //=> true
 * node.value = 'foo';
 * utils.isEmpty(node); //=> false
 * ```
 */

export function isEmpty<T>(node: NodeLike<T>, fn: (node: NodeLike<T>) => boolean): boolean;

/**
 * Returns true if the `state.inside` stack for the given type exists
 * and has one or more nodes on it.
 *
 * ```ts
 * var state = { inside: {}};
 * var node = new Node({type: 'brace'});
 * console.log(utils.isInsideType(state, 'brace')); //=> false
 * utils.addType(state, node);
 * console.log(utils.isInsideType(state, 'brace')); //=> true
 * utils.removeType(state, node);
 * console.log(utils.isInsideType(state, 'brace')); //=> false
 * ```
 */

export function isInsideType<T>(state: StateLike<T>, type: string): boolean;

/**
 * Returns true if `node` is either a child or grand-child of the given `type`,
 * or `state.inside[type]` is a non-empty array.
 *
 * ```ts
 * var state = { inside: {}};
 * var node = new Node({type: 'brace'});
 * var open = new Node({type: 'brace.open'});
 * console.log(utils.isInside(state, open, 'brace')); //=> false
 * utils.pushNode(node, open);
 * console.log(utils.isInside(state, open, 'brace')); //=> true
 * ```
 */

//TODO: `state.inside` can be undefined.
export function isInside<T>(state: State<T>, node: NodeLike<T>, type: string): boolean;

/**
 * Get the last `n` element from the given `array`.
 */

//TODO: Can be undefined and null?
export function last<T>(arr: Array<T>, n: number): T | undefined | null;

/**
 * Get the last node from `node.nodes.`
 */

//TODO: Can be undefined and null?
export function lastNode<T>(node: NodeLike<T>): NodeLike<T> | undefined | null;

/**
 * Cast the given `value` to an array.
 *
 * ```ts
 * console.log(utils.arrayify(''));
 * //=> []
 * console.log(utils.arrayify('foo'));
 * //=> ['foo']
 * console.log(utils.arrayify(['foo']));
 * //=> ['foo']
 * ```
 */

//TODO(self): fix this magic
export function arrayify<T>(value: T): T[];

/**
 * Convert the given `value` to a string by joining with `,`. Useful
 * for creating a cheerio/CSS/DOM-style selector from a list of strings.
 */

export function stringify(value: any): string;

/**
 * Ensure that the given value is a string and call `.trim()` on it,
 * or return an empty string.
 */

export function trim(str: string): string;