'use strict';

require('mocha');
var assert = require('assert');
var Parser = require('snapdragon/lib/parser');
var Compiler = require('snapdragon/lib/compiler');
var decorate = require('./support');
var utils = require('..');
var parser;
var ast;

class Node {
  constructor(node) {
    this.define(this, 'parent', null);
    this.isNode = true;
    this.type = node.type;
    this.value = node.value;
    if (node.nodes) {
      this.nodes = node.nodes;
    }
  }
  define(key, value) {
    Object.defineProperty(this, key, { value: value });
    return this;
  }
  get siblings() {
    return this.parent ? this.parent.nodes : null;
  }
  get last() {
    if (this.nodes && this.nodes.length) {
      return this.nodes[this.nodes.length - 1];
    }
  }
}

describe('snapdragon-node', function() {
  beforeEach(function() {
    parser = new Parser({Node: Node})
      .set('text', function() {
        var match = this.match(/^[a-z]+/);
        if (match) {
          return this.node(match[0]);
        }
      })
      .set('slash', function() {
        var match = this.match(/^\//);
        if (match) {
          return this.node(match[0]);
        }
      })
      .set('star', function() {
        var match = this.match(/^\*/);
        if (match) {
          return this.node(match[0]);
        }
      })

    ast = new Node(parser.parse('a/*/c'));

    // console.log(ast)
  });

  describe('.arrayify', function() {
    it('should cast a string to an array', function() {
      assert.deepEqual(utils.arrayify('foo'), ['foo']);
    });

    it('should return an array', function() {
      assert.deepEqual(utils.arrayify(['foo']), ['foo']);
    });

    it('should return an empty array when not a string or array', function() {
      assert.deepEqual(utils.arrayify(), []);
    });
  });

  describe('.stringify', function() {
    it('should return a string', function() {
      assert.equal(utils.stringify('foo'), 'foo');
    });

    it('should stringify an array', function() {
      assert.equal(utils.stringify(['foo', 'bar']), 'foo,bar');
    });
  });

  describe('.identity', function() {
    it('should return node.value as it was created by the parser', function() {
      var res = new Compiler()
        .set('star', utils.identity)
        .set('slash', utils.identity)
        .set('text', utils.identity)
        .compile(ast);

      assert.equal(res.output, 'a/*/c');
    });
  });

  describe('.noop', function() {
    it('should make a node an empty text node', function() {
      var res = new Compiler()
        .set('star', utils.noop)
        .set('slash', utils.identity)
        .set('text', utils.identity)
        .compile(ast);

      assert.equal(res.output, 'a//c');
    });
  });

  describe('.append', function() {
    it('should append the specified text', function() {
      var res = new Compiler()
        .set('star', utils.append('@'))
        .set('slash', utils.append('\\'))
        .set('text', utils.identity)
        .compile(ast);

      assert.equal(res.output, 'a\\@\\c');
    });

    it('should use compiler.append method when it exists', function() {
      var compiler = new Compiler()
      compiler.append = compiler.emit.bind(compiler);

      var res = compiler.set('star', utils.append('@'))
        .set('slash', utils.append('\\'))
        .set('text', utils.identity)
        .compile(ast);

      assert.equal(res.output, 'a\\@\\c');
    });
  });

  describe('.toNoop', function() {
    it('should throw an error when node is not a node', function() {
      assert.throws(function() {
        utils.toNoop();
      });
    });

    it('should convert a node to a noop node', function() {
      utils.toNoop(ast);
      assert(!ast.nodes);
    });

    it('should convert a node to a noop with the given nodes value', function() {
      utils.toNoop(ast, []);
      assert.equal(ast.nodes.length, 0);
    });
  });

  describe('.visit', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.visit();
      });
    });

    it('should throw an error when node.nodes is not an array', function() {
      assert.throws(function() {
        utils.visit(new Node({type: 'foo', value: ''}));
      });
    });

    it('should visit a node with the given function', function() {
      var type = null;
      utils.visit(ast, function(node) {
        if (type === null) {
          type = node.type;
        }
      });
      assert.equal(type, 'root');
    });
  });

  describe('.mapVisit', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.mapVisit();
      });
    });

    it('should throw an error when node.nodes is not an array', function() {
      assert.throws(function() {
        utils.mapVisit(new Node({type: 'foo', value: ''}));
      });
    });

    it('should map "visit" over node.nodes', function() {
      var type = null;
      utils.mapVisit(ast, function(node) {
        if (type === null && node.parent && node.parent.type === 'root') {
          type = node.type;
        }
      });
      assert.equal(type, 'bos');
    });
  });

  describe('.pushNode', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.pushNode();
      });
    });

    it('should add a node to the end of node.nodes', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});
      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');
    });

    it('should work when node.push is not a function', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});

      node.pushNode = null;
      node.push = null;

      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');
    });
  });

  describe('.unshiftNode', function() {
    it('should throw an error when parent is not a node', function() {
      assert.throws(function() {
        utils.unshiftNode();
      });
    });

    it('should add a node to the beginning of node.nodes', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});
      utils.unshiftNode(node, a);
      utils.unshiftNode(node, b);
      assert.equal(node.nodes[1].type, 'a');
      assert.equal(node.nodes[0].type, 'b');
    });

    it('should work when node.unshift is not a function', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});

      node.unshiftNode = null;
      node.unshift = null;

      utils.unshiftNode(node, a);
      utils.unshiftNode(node, b);
      assert.equal(node.nodes[1].type, 'a');
      assert.equal(node.nodes[0].type, 'b');
    });
  });

  describe('.popNode', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.popNode();
      });
    });

    it('should pop a node from node.nodes', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});
      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.popNode(node);
      utils.popNode(node);
      assert.equal(node.nodes.length, 0);
    });

    it('should work when node.pop is not a function', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});

      node.popNode = null;
      node.pop = null;

      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.popNode(node);
      utils.popNode(node);
      assert.equal(node.nodes.length, 0);
    });

    it('should work when node.pop is a function', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});

      decorate(node);

      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.popNode(node);
      utils.popNode(node);
      assert.equal(node.nodes.length, 0);
    });
  });

  describe('.shiftNode', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.shiftNode();
      });
    });

    it('should shift a node from node.nodes', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});
      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.shiftNode(node);
      utils.shiftNode(node);
      assert.equal(node.nodes.length, 0);
    });

    it('should work when node.shift is not a function', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});

      node.shiftNode = null;
      node.shift = null;

      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.shiftNode(node);
      utils.shiftNode(node);
      assert.equal(node.nodes.length, 0);
    });

    it('should work when node.shift is a function', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});

      decorate(node);

      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.shiftNode(node);
      utils.shiftNode(node);
      assert.equal(node.nodes.length, 0);
    });
  });

  describe('.removeNode', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.removeNode();
      });
    });

    it('should remove a node from node.nodes', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});
      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.removeNode(node, a);
      assert.equal(node.nodes.length, 1);

      utils.removeNode(node, b);
      assert.equal(node.nodes.length, 0);
    });

    it('should work when node.remove is not a function', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});

      node.removeNode = null;
      node.remove = null;

      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.removeNode(node, a);
      assert.equal(node.nodes.length, 1);

      utils.removeNode(node, b);
      assert.equal(node.nodes.length, 0);
    });

    it('should work when node.remove is a function', function() {
      var node = new Node({type: 'brace'});
      var a = new Node({type: 'a', value: 'foo'});
      var b = new Node({type: 'b', value: 'foo'});

      decorate(node);

      utils.pushNode(node, a);
      utils.pushNode(node, b);
      assert.equal(node.nodes[0].type, 'a');
      assert.equal(node.nodes[1].type, 'b');

      utils.removeNode(node, a);
      utils.removeNode(node, b);
      assert.equal(node.nodes.length, 0);
    });

    it('should return when node.nodes does not exist', function() {
      assert.doesNotThrow(function() {
        var node = new Node({type: 'brace'});
        utils.removeNode(node, node);
      });

      assert.doesNotThrow(function() {
        var node = new Node({type: 'brace'});
        node.removeNode = null;
        node.remove = null;
        utils.removeNode(node, node);
      });
    });

    it('should return when the given node is not in node.nodes', function() {
      assert.doesNotThrow(function() {
        var node = new Node({type: 'brace'});
        var foo = new Node({type: 'foo'});
        var bar = new Node({type: 'bar'});
        utils.pushNode(node, bar);
        utils.removeNode(node, foo);
      });

      assert.doesNotThrow(function() {
        var node = new Node({type: 'brace'});
        var foo = new Node({type: 'foo'});
        var bar = new Node({type: 'bar'});
        node.removeNode = null;
        node.remove = null;
        utils.pushNode(node, bar);
        utils.removeNode(node, foo);
      });
    });
  });

  describe('.addOpen', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.addOpen();
      });
    });

    it('should add an open node', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      utils.addOpen(node, Node);
      assert.equal(node.nodes[0].type, 'brace.open');
    });

    it('should work when node.unshift is a function', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      decorate(node);
      utils.addOpen(node, Node);
      assert.equal(node.nodes[0].type, 'brace.open');
    });

    it('should work when node.unshift is not a function', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      node.unshiftNode = null;
      node.unshift = null;
      utils.addOpen(node, Node);
      assert.equal(node.nodes[0].type, 'brace.open');
    });

    it('should take a filter function', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      utils.addOpen(node, Node, function(node) {
        return node.type !== 'brace';
      });
      assert(!node.nodes);
    });

    it('should use the given value on the open node', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      utils.addOpen(node, Node, '{');
      assert.equal(node.nodes[0].value, '{');
    });
  });

  describe('.addClose', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.addClose();
      });
    });

    it('should add a close node', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      utils.pushNode(node, text);
      utils.addClose(node, Node);

      assert.equal(node.nodes[0].type, 'text');
      assert.equal(node.nodes[1].type, 'brace.close');
    });

    it('should work when node.push is not a function', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      node.pushNode = null;
      node.push = null;

      utils.pushNode(node, text);
      utils.addClose(node, Node);

      assert.equal(node.nodes[0].type, 'text');
      assert.equal(node.nodes[1].type, 'brace.close');
    });

    it('should work when node.push is a function', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      decorate(node);

      utils.pushNode(node, text);
      utils.addClose(node, Node);

      assert.equal(node.nodes[0].type, 'text');
      assert.equal(node.nodes[1].type, 'brace.close');
    });

    it('should take a filter function', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      utils.addClose(node, Node, function(node) {
        return node.type !== 'brace';
      });
      assert(!node.nodes);
    });

    it('should use the given value on the close node', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      utils.addClose(node, Node, '}');
      assert.equal(node.nodes[0].value, '}');
    });
  });

  describe('.wrapNodes', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.wrapNodes();
      });
    });

    it('should add an open node', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      utils.wrapNodes(node, Node);

      assert.equal(node.nodes[0].type, 'brace.open');
    });

    it('should add a close node', function() {
      var node = new Node({type: 'brace'});
      var text = new Node({type: 'text', value: 'foo'});
      utils.pushNode(node, text);
      utils.wrapNodes(node, Node);

      assert.equal(node.nodes[0].type, 'brace.open');
      assert.equal(node.nodes[1].type, 'text');
      assert.equal(node.nodes[2].type, 'brace.close');
    });
  });

  describe('.isEmpty', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.isEmpty();
      });
    });

    it('should return true node.value is an empty string', function() {
      assert(utils.isEmpty(new Node({type: 'text', value: ''})));
    });

    it('should return true node.value is undefined', function() {
      assert(utils.isEmpty(new Node({type: 'text'})));
    });

    it('should return true when node.nodes is empty', function() {
      var foo = new Node({type: 'foo'});
      var bar = new Node({type: 'text', value: 'bar'});
      utils.pushNode(foo, bar);
      assert(!utils.isEmpty(foo));
      utils.shiftNode(foo);
      assert(utils.isEmpty(foo));
    });

    it('should return true when node.nodes is all non-text nodes', function() {
      var node = new Node({type: 'parent'});
      var foo = new Node({type: 'foo'});
      var bar = new Node({type: 'bar'});
      var baz = new Node({type: 'baz'});
      utils.pushNode(node, foo);
      utils.pushNode(node, bar);
      utils.pushNode(node, baz);
      assert(utils.isEmpty(foo));
    });

    it('should return call a custom function if only one node exists', function() {
      var foo = new Node({type: 'foo'});
      var text = new Node({type: 'text', value: ''});
      utils.pushNode(foo, text);
      assert(utils.isEmpty(foo, node => !node.value));
    });

    it('should return true when only open and close nodes exist', function() {
      var brace = new Node({type: 'brace'});
      var open = new Node({type: 'brace.open'});
      var close = new Node({type: 'brace.close'});
      utils.pushNode(brace, open);
      utils.pushNode(brace, close);
      assert(utils.isEmpty(brace));
    });

    it('should call a custom function on "middle" nodes (1)', function() {
      var brace = new Node({type: 'brace'});
      var open = new Node({type: 'brace.open'});
      var text = new Node({type: 'text', value: ''});
      var close = new Node({type: 'brace.close'});
      utils.pushNode(brace, open);
      utils.pushNode(brace, text);
      utils.pushNode(brace, text);
      utils.pushNode(brace, text);
      utils.pushNode(brace, close);
      assert(utils.isEmpty(brace, function(node) {
        if (node.nodes && node.nodes.length === 0) {
          return true;
        }
        return !utils.value(node);
      }));
    });

    it('should call a custom function on "middle" nodes (2)', function() {
      var brace = new Node({type: 'brace'});
      var open = new Node({type: 'brace.open'});
      var text = new Node({type: 'text', value: ''});
      var close = new Node({type: 'brace.close'});
      utils.pushNode(brace, open);
      utils.pushNode(brace, text);
      utils.pushNode(brace, text);
      utils.pushNode(brace, text);
      utils.pushNode(brace, close);
      assert(!utils.isEmpty(brace, function(node) {
        return node.parent.nodes.length === 0;
      }));
    });

    it('should call a custom function on "middle" nodes (3)', function() {
      var brace = new Node({type: 'brace'});
      var open = new Node({type: 'brace.open'});
      var text = new Node({type: 'text', value: 'foo'});
      var close = new Node({type: 'brace.close'});
      utils.pushNode(brace, open);
      utils.pushNode(brace, text);
      utils.pushNode(brace, close);
      assert(!utils.isEmpty(brace, function(node) {
        if (node.type !== 'text') {
          return false;
        }
        return node.value.trim() === '';
      }));
    });

    it('should call a custom function on "middle" nodes (4)', function() {
      var brace = new Node({type: 'brace'});
      var open = new Node({type: 'brace.open'});
      var empty = new Node({type: 'text', value: ''});
      var text = new Node({type: 'text', value: 'foo'});
      var close = new Node({type: 'brace.close'});
      utils.pushNode(brace, open);
      utils.pushNode(brace, empty);
      utils.pushNode(brace, empty);
      utils.pushNode(brace, empty);
      utils.pushNode(brace, empty);
      utils.pushNode(brace, text);
      utils.pushNode(brace, close);
      assert(!utils.isEmpty(brace, function(node) {
        if (node.type !== 'text') {
          return false;
        }
        return node.value.trim() === '';
      }));
    });
  });

  describe('.isType', function() {
    it('should throw an error when matcher is invalid', function() {
      assert.throws(function() {
        utils.isType(new Node({type: 'foo'}));
      });
    });

    it('should return false if the node is not the given type', function() {
      assert(!utils.isType());
      assert(!utils.isType({}, 'root'));
    });

    it('should return true if the node is the given type', function() {
      assert(utils.isType(ast, 'root'));
      assert(utils.isType(ast.last, 'eos'));
    });
  });

  describe('.isInsideType', function() {
    it('should throw an error when parent is not a node', function() {
      assert.throws(function() {
        utils.isInsideType();
      });
    });

    it('should throw an error when child not a node', function() {
      assert.throws(function() {
        utils.isInsideType(new Node({type: 'foo'}));
      });
    });

    it('should return false when state.inside is not an object', function() {
      var state = {};
      var node = new Node({type: 'brace'});
      assert(!utils.isInsideType(state, 'brace'));
    });

    it('should return false when state.inside[type] is not an object', function() {
      var state = {inside: {}};
      var node = new Node({type: 'brace'});
      assert(!utils.isInsideType(state, 'brace'));
    });

    it('should return true when state has the given type', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(utils.isInsideType(state, 'brace'));
    });

    it('should return false when state does not have the given type', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});

      utils.addType(state, node);
      assert(utils.isInsideType(state, 'brace'));

      utils.removeType(state, node);
      assert(!utils.isInsideType(state, 'brace'));
    });
  });

  describe('.isInside', function() {
    it('should throw an error when parent is not a node', function() {
      assert.throws(function() {
        utils.isInside();
      });
    });

    it('should throw an error when child not a node', function() {
      assert.throws(function() {
        utils.isInside(new Node({type: 'foo'}));
      });
    });

    it('should return false when state.inside is not an object', function() {
      var state = {};
      var node = new Node({type: 'brace'});
      assert(!utils.isInside(state, node, 'brace'));
    });

    it('should return false when state.inside[type] is not an object', function() {
      var state = {inside: {}};
      var node = new Node({type: 'brace'});
      assert(!utils.isInside(state, node, 'brace'));
    });

    it('should return true when state has the given type', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(utils.isInside(state, node, 'brace'));
    });

    it('should return true when state has one of the given types', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(utils.isInside(state, node, ['foo', 'brace']));
    });

    it('should return false when state does not have one of the given types', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(!utils.isInside(state, node, ['foo', 'bar']));
    });

    it('should return true when a regex matches a type', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(utils.isInside(state, node, /(foo|brace)/));
    });

    it('should return true when the type matches parent.type', function() {
      var state = {};
      var brace = new Node({type: 'brace'});
      var node = new Node({type: 'brace.open'});
      utils.pushNode(brace, node);
      assert(utils.isInside(state, node, 'brace'));
    });

    it('should return true when regex matches parent.type', function() {
      var state = {};
      var brace = new Node({type: 'brace'});
      var node = new Node({type: 'brace.open'});
      utils.pushNode(brace, node);
      assert(utils.isInside(state, node, /(foo|brace)/));
    });

    it('should return false when a regex does not match a type', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(!utils.isInside(state, node, /(foo|bar)/));
    });

    it('should return false when type is invalie', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(!utils.isInside(state, node, null));
    });

    it('should return false when state does not have the given type', function() {
      var state = { inside: {}};
      var node = new Node({type: 'brace'});

      utils.addType(state, node);
      assert(utils.isInside(state, node, 'brace'));

      utils.removeType(state, node);
      assert(!utils.isInside(state, node, 'brace'));
    });
  });

  describe('.hasType', function() {
    it('should return true if node.nodes has the given type', function() {
      assert(utils.hasType(ast, 'text'));
      assert(!utils.hasType(ast, 'foo'));
    });

    it('should return false when node.nodes does not exist', function() {
      assert(!utils.hasType(new Node({type: 'foo'})));
    });
  });

  describe('.firstOfType', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.firstOfType();
      });
    });

    it('should get the first node of the given type', function() {
      var node = utils.firstOfType(ast.nodes, 'text');
      assert.equal(node.type, 'text');
    });
  });

  describe('.last', function() {
    it('should get the last node', function() {
      assert.equal(utils.last(ast.nodes).type, 'eos');
    });
  });

  describe('.findNode', function() {
    it('should get the node with the given type', function() {
      var text = utils.findNode(ast.nodes, 'text');
      assert.equal(text.type, 'text');
    });

    it('should get the node matching the given regex', function() {
      var text = utils.findNode(ast.nodes, /text/);
      assert.equal(text.type, 'text');
    });

    it('should get the first matching node', function() {
      var node = utils.findNode(ast.nodes, [/text/, 'bos']);
      assert.equal(node.type, 'bos');

      node = utils.findNode(ast.nodes, [/text/]);
      assert.equal(node.type, 'text');
    });

    it('should get the node at the given index', function() {
      var bos = utils.findNode(ast.nodes, 0);
      assert.equal(bos.type, 'bos');

      var text = utils.findNode(ast.nodes, 1);
      assert.equal(text.type, 'text');
    });

    it('should return null when node does not exist', function() {
      assert.equal(utils.findNode(new Node({type: 'foo'})), null);
    });
  });

  describe('.removeNode', function() {
    it('should throw an error when parent is not a node', function() {
      assert.throws(function() {
        utils.removeNode();
      });
    });

    it('should remove a node from parent.nodes', function() {
      var brace = new Node({type: 'brace'});
      var open = new Node({type: 'brace.open'});
      var foo = new Node({type: 'foo'});
      var bar = new Node({type: 'bar'});
      var baz = new Node({type: 'baz'});
      var qux = new Node({type: 'qux'});
      var close = new Node({type: 'brace.close'});
      utils.pushNode(brace, open);
      utils.pushNode(brace, foo);
      utils.pushNode(brace, bar);
      utils.pushNode(brace, baz);
      utils.pushNode(brace, qux);
      utils.pushNode(brace, close);

      assert.equal(brace.nodes.length, 6);
      assert.equal(brace.nodes[0].type, 'brace.open');
      assert.equal(brace.nodes[1].type, 'foo');
      assert.equal(brace.nodes[2].type, 'bar');
      assert.equal(brace.nodes[3].type, 'baz');
      assert.equal(brace.nodes[4].type, 'qux');
      assert.equal(brace.nodes[5].type, 'brace.close');

      // remove node
      utils.removeNode(brace, bar);
      assert.equal(brace.nodes.length, 5);
      assert.equal(brace.nodes[0].type, 'brace.open');
      assert.equal(brace.nodes[1].type, 'foo');
      assert.equal(brace.nodes[2].type, 'baz');
      assert.equal(brace.nodes[3].type, 'qux');
      assert.equal(brace.nodes[4].type, 'brace.close');
    });
  });

  describe('.isOpen', function() {
    it('should be true if node is an ".open" node', function() {
      var node = new Node({type: 'foo.open'});
      assert(utils.isOpen(node));
    });

    it('should be false if node is not an ".open" node', function() {
      var node = new Node({type: 'foo'});
      assert(!utils.isOpen(node));
    });
  });

  describe('.isClose', function() {
    it('should be true if node is a ".close" node', function() {
      var node = new Node({type: 'foo.close'});
      assert(utils.isClose(node));
    });

    it('should be false if node is not a ".close" node', function() {
      var node = new Node({type: 'foo'});
      assert(!utils.isClose(node));
    });
  });

  describe('.hasOpen', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.hasOpen();
      });
    });

    it('should be true if node has an ".open" node', function() {
      var parent = new Node({type: 'foo'});
      var node = new Node({type: 'foo.open'});
      utils.pushNode(parent, node);
      assert(utils.hasOpen(parent));
    });

    it('should be false if does not have an ".open" node', function() {
      var parent = new Node({type: 'foo'});
      assert(!utils.hasOpen(parent));
    });
  });

  describe('.hasClose', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.hasClose();
      });
    });

    it('should be true if node has a ".close" node', function() {
      var parent = new Node({type: 'foo'});
      var open = new Node({type: 'foo.open'});
      var close = new Node({type: 'foo.close'});
      utils.pushNode(parent, open);
      utils.pushNode(parent, close);
      assert(utils.hasClose(parent));
    });

    it('should be false if does not have a ".close" node', function() {
      var parent = new Node({type: 'foo'});
      assert(!utils.hasClose(parent));
    });
  });

  describe('.hasOpenAndClose', function() {
    it('should throw an error when not a node', function() {
      assert.throws(function() {
        utils.hasOpenAndClose();
      });
    });

    it('should be true if node has ".open" and ".close" nodes', function() {
      var parent = new Node({type: 'foo'});
      var open = new Node({type: 'foo.open'});
      var close = new Node({type: 'foo.close'});
      utils.pushNode(parent, open);
      utils.pushNode(parent, close);
      assert(utils.hasOpenAndClose(parent));
    });

    it('should be false if does not have a ".close" node', function() {
      var parent = new Node({type: 'foo'});
      var open = new Node({type: 'foo.open'});
      utils.pushNode(parent, open);
      assert(!utils.hasOpenAndClose(parent));
    });

    it('should be false if does not have an ".open" node', function() {
      var parent = new Node({type: 'foo'});
      var close = new Node({type: 'foo.close'});
      utils.pushNode(parent, close);
      assert(!utils.hasOpenAndClose(parent));
    });
  });

  describe('.pushNode', function() {
    it('should throw an error when parent is not a node', function() {
      assert.throws(function() {
        utils.pushNode();
      });
    });

    it('should add a node to `node.nodes`', function() {
      var node = new Node({type: 'foo'});
      utils.pushNode(ast, node);
      assert.equal(ast.last.type, 'foo');
    });

    it('should set the parent on the given node', function() {
      var node = new Node({type: 'foo'});
      utils.pushNode(ast, node);
      assert.equal(node.parent.type, 'root');
    });

    it('should set the parent.nodes as node.siblings', function() {
      var node = new Node({type: 'foo'});
      assert.equal(node.siblings, null);
      utils.pushNode(ast, node);
      assert.equal(node.siblings.length, 8);
    });
  });

  describe('.addType', function() {
    it('should throw an error when state is not given', function() {
      assert.throws(function() {
        utils.addType();
      });
    });

    it('should throw an error when a node is not passed', function() {
      assert.throws(function() {
        utils.addType({});
      });
    });

    it('should add the type to the state.inside array', function() {
      var state = {};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(state.inside);
      assert(state.inside.brace);
      assert.equal(state.inside.brace.length, 1);
    });

    it('should add the type based on parent.type', function() {
      var state = {};
      var parent = new Node({type: 'brace'});
      var node = new Node({type: 'brace.open'});
      utils.pushNode(parent, node);
      utils.addType(state, node);
      assert(state.inside);
      assert(state.inside.brace);
      assert.equal(state.inside.brace.length, 1);
    });
  });

  describe('.removeType', function() {
    it('should throw an error when state is not given', function() {
      assert.throws(function() {
        utils.removeType();
      });
    });

    it('should throw an error when a node is not passed', function() {
      assert.throws(function() {
        utils.removeType({});
      });
    });

    it('should add a state.inside object', function() {
      var state = {};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(state.inside);
    });

    it('should add a type array to the state.inside object', function() {
      var state = {};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(state.inside);
      assert(Array.isArray(state.inside.brace));
    });

    it('should add the node to the state.inside type array', function() {
      var state = {};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(state.inside);
      assert(state.inside.brace);
      assert.equal(state.inside.brace.length, 1);
      utils.removeType(state, node);
      assert.equal(state.inside.brace.length, 0);
    });

    it('should use a type array if it already exists', function() {
      var state = { inside: { brace: [new Node({type: 'brace.open'})] }};
      var node = new Node({type: 'brace'});
      utils.addType(state, node);
      assert(state.inside);
      assert(state.inside.brace);
      assert.equal(state.inside.brace.length, 2);
      utils.removeType(state, node);
      assert.equal(state.inside.brace.length, 1);
    });

    it('should remove the type based on parent.type', function() {
      var state = { inside: { brace: [new Node({type: 'brace.open'})] }};
      var parent = new Node({type: 'brace'});
      var node = new Node({type: 'brace.open'});
      utils.pushNode(parent, node);
      utils.addType(state, node);
      assert(state.inside);
      assert(state.inside.brace);
      assert.equal(state.inside.brace.length, 2);
      utils.removeType(state, node);
      assert.equal(state.inside.brace.length, 1);
    });

    it('should throw an error when state.inside does not exist', function() {
      var state = {};
      var node = new Node({type: 'brace'});
      assert.throws(function() {
        utils.removeType(state, node);
      });
    });

    it('should just return when state.inside type does not exist', function() {
      var state = {inside: {}};
      var node = new Node({type: 'brace'});
      utils.removeType(state, node);
    });
  });
});
