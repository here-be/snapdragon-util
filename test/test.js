'use strict';

require('mocha');
var assert = require('assert');
var captureSet = require('snapdragon-capture-set');
var Parser = require('snapdragon/lib/parser');
var Node = require('snapdragon-node');
var utils = require('..');
var parser;
var ast;

describe('snapdragon-node', function() {
  beforeEach(function() {
    parser = new Parser()
    parser.use(captureSet())
      .captureSet('brace', /^\{/, /^\}/)
      .set('text', function() {
        var pos = this.position();
        var m = this.match(/^[^{}]/);
        if (!m) return;
        return pos({
          type: 'text',
          val: m[0]
        });
      });

    // ensure the ast is an instance of Node
    ast = new Node(parser.parse('{a{b}c}'));
  });

  describe('.isType', function() {
    it('should return true if the node is the given type', function() {
      assert(utils.isType(ast, 'root'));
      assert(utils.isType(ast.last, 'eos'));
    });
  });

  describe('.hasType', function() {
    it('should return true if node.nodes has the given type', function() {
      assert(utils.hasType(ast, 'brace'));
      assert(!utils.hasType(ast, 'foo'));
    });
  });

  describe('.firstOfType', function() {
    it('should get the first node of the given type from `node.nodes`', function() {
      var brace = utils.firstOfType(ast.nodes, 'brace');
      assert.equal(brace.type, 'brace');
    });
  });

  describe('.last', function() {
    it('should get the last node from `node.nodes`', function() {
      assert.equal(utils.last(ast.nodes).type, 'eos');
    });
  });

  describe('.getNode', function() {
    it('should get the node with the given type from `node.nodes`', function() {
      var brace = utils.getNode(ast.nodes, 'brace');
      assert.equal(brace.type, 'brace');
      var open = brace.getNode('brace.open');
      assert.equal(open.type, 'brace.open');
    });

    it('should get the node matching the given regex from `node.nodes`', function() {
      var brace = utils.getNode(ast.nodes, /brace/);
      assert.equal(brace.type, 'brace');
      var open = brace.getNode('brace.open');
      assert.equal(open.type, 'brace.open');
    });

    it('should get the first matching node from `node.nodes`', function() {
      var node = utils.getNode(ast.nodes, [/brace/, 'bos']);
      assert.equal(node.type, 'bos');

      node = utils.getNode(ast.nodes, [/brace/]);
      assert.equal(node.type, 'brace');
    });

    it('should get the node at the given index from `node.nodes`', function() {
      var bos = utils.getNode(ast.nodes, 0);
      assert.equal(bos.type, 'bos');
      var brace = ast.getNode(1);
      assert.equal(brace.type, 'brace');
    });
  });

  describe('.pushNode', function() {
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

    it('should set the parent.nodes as `.siblings` on the given node', function() {
      var node = new Node({type: 'foo'});
      utils.pushNode(ast, node);
      assert.equal(node.siblings.length, 4);
    });
  });
});
