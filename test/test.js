'use strict';

require('mocha');
var assert = require('assert');
var util = require('..');

describe('snapdragon-util', function() {
  it('should export an object', function() {
    assert(util);
    assert.equal(typeof util, 'object');
  });

  // it('should throw an error when invalid args are passed', function(cb) {
  //   try {
  //     util();
  //     cb(new Error('expected an error'));
  //   } catch (err) {
  //     assert(err);
  //     assert.equal(err.message, 'expected first argument to be a string');
  //     assert.equal(err.message, 'expected callback to be a function');
  //     cb();
  //   }
  // });
});
