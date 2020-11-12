const Request = require('../').Request;
const StubWindow = require('../').StubWindow;
const assert = require('chai').assert;
const sinon = require('sinon');
const router = require('../');

describe('Request Test', () => {
  let instance, win;

  beforeEach(() => {
    win = new StubWindow();
  });

  it('is instantiable', () => {
    instance = new Request(null, '/abcd/efgh', win);
    assert(instance);
  });

  it('parses search into a query object', () => {
    instance = new Request(null, '/abcd?efgh=ijkl', win);
    assert(instance.query, 'Expected object');
    assert.equal(instance.query.efgh, 'ijkl');
  });
});
