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

  it('parses boolean values', () => {
    instance = new Request(null, '/abcd?efgh=true&ijkl=false', win);
    const q = instance.query;
    assert.equal(q.efgh, true);
    assert.equal(q.ijkl, false);
  });

  it('parses numeric values', () => {
    instance = new Request(null, '/abcd?efgh=-10&ijkl=34.24', win);
    const q = instance.query;
    assert.equal(q.efgh, -10);
    assert.equal(q.ijkl, 34.24);
  });
});
