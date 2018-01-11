'use strict';

var assert = require('assert');
var isObject = require('isobject');
var define = require('define-property');
var getters = ['siblings', 'index', 'first', 'last', 'prev', 'next'];

/**
 * This is a shim used in the unit tests
 * to ensure that snapdragon-util works with
 * older and newer versions of snapdragon-node
 */

function isNode(node) {
  return isObject(node) && node.isNode === true;
}

module.exports = function(node) {

  /**
   * Define a non-enumberable property on the node instance.
   *
   * ```js
   * var node = new Node();
   * node.define('foo', 'something non-enumerable');
   * ```
   * @param {String} `name`
   * @param {any} `value`
   * @return {Object} returns the node instance
   * @api public
   */

  node.define = function(name, value) {
    define(this, name, value);
    return this;
  };

  /**
   * Given node `foo` and node `bar`, push node `bar` onto `foo.nodes`, and
   * set `foo` as `bar.parent`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * foo.push(bar);
   * ```
   * @param {Object} `node`
   * @return {Number} Returns the length of `node.nodes`
   * @api public
   */

  node.push = function(node) {
    assert(isNode(node), 'expected node to be an instance of Node');
    define(node, 'parent', this);

    this.nodes = this.nodes || [];
    return this.nodes.push(node);
  };

  /**
   * Given node `foo` and node `bar`, unshift node `bar` onto `foo.nodes`, and
   * set `foo` as `bar.parent`.
   *
   * ```js
   * var foo = new Node({type: 'foo'});
   * var bar = new Node({type: 'bar'});
   * foo.unshift(bar);
   * ```
   * @param {Object} `node`
   * @return {Number} Returns the length of `node.nodes`
   * @api public
   */

  node.unshift = function(node) {
    assert(isNode(node), 'expected node to be an instance of Node');
    define(node, 'parent', this);

    this.nodes = this.nodes || [];
    return this.nodes.unshift(node);
  };

  /**
   * Pop a node from `node.nodes`.
   *
   * ```js
   * var node = new Node({type: 'foo'});
   * node.push(new Node({type: 'a'}));
   * node.push(new Node({type: 'b'}));
   * node.push(new Node({type: 'c'}));
   * node.push(new Node({type: 'd'}));
   * console.log(node.nodes.length);
   * //=> 4
   * node.pop();
   * console.log(node.nodes.length);
   * //=> 3
   * ```
   * @return {Number} Returns the popped `node`
   * @api public
   */

  node.pop = function() {
    return this.nodes && this.nodes.pop();
  };

  /**
   * Shift a node from `node.nodes`.
   *
   * ```js
   * var node = new Node({type: 'foo'});
   * node.push(new Node({type: 'a'}));
   * node.push(new Node({type: 'b'}));
   * node.push(new Node({type: 'c'}));
   * node.push(new Node({type: 'd'}));
   * console.log(node.nodes.length);
   * //=> 4
   * node.shift();
   * console.log(node.nodes.length);
   * //=> 3
   * ```
   * @return {Object} Returns the shifted `node`
   * @api public
   */

  node.shift = function() {
    return this.nodes && this.nodes.shift();
  };

  /**
   * Remove `node` from `node.nodes`.
   *
   * ```js
   * node.remove(childNode);
   * ```
   * @param {Object} `node`
   * @return {Object} Returns the removed node.
   * @api public
   */

  node.remove = function(node) {
    assert(isNode(node), 'expected node to be an instance of Node');
    this.nodes = this.nodes || [];
    var idx = node.index;
    if (idx !== -1) {
      return this.nodes.splice(idx, 1);
    }
    return null;
  };
};
