const Route = require('..').Route;
const assert = require('chai').assert;
const sinon = require('sinon');

describe('Route', () => {
  it('is instantiable', () => {
    const route = new Route('get', '/abcd', sinon.spy());
    assert(route.handles('get', '/abcd'));
  });

  it('matches express', () => {
    const route = new Route('get', '/abcd/:id/:other', sinon.spy());
    const result = route.handles('get', '/abcd/efgh/ijkl');

    assert(result);
    assert.isFalse(route.isError);
    assert.equal(route.params.id, 'efgh');
    assert.equal(route.params.other, 'ijkl');
  });

  it('identifies error handlers', () => {
    const handler = (req, res, next, err) => {};
    const route = new Route('get', '/abcd', handler);
    assert(route.isError);
  });

  it('runs multiple times', () => {
    const route = new Route('get', '/abcd/:id/:other', sinon.spy());
    assert.isFalse(route.isError);

    let result = route.handles('get', '/abcd/efgh/ijkl');
    assert(result);
    assert.equal(route.params.id, 'efgh');
    assert.equal(route.params.other, 'ijkl');

    result = route.handles('get', '/abcd/efgh');
    assert.isFalse(result);

    result = route.handles('post', '/abcd/efgh/ijkl');
    assert.isFalse(result);

    result = route.handles('get', '/abcd/mnop/qrst');
    assert(result);
    assert.equal(route.params.id, 'mnop');
    assert.equal(route.params.other, 'qrst');
  });

  it('matches on all methods', () => {
    const route = new Route('ALL', '/abcd', sinon.spy());
    let result;

    ['HEAD', 'GET', 'POST', 'PUT', 'DELETE'].forEach((method) => {
      result = route.handles(method, '/abcd');
      assert(result);
    });
  });

  it('matches all paths', () => {
    const route = new Route('get', 'all', sinon.spy());
    let result;

    ['/abcd', '/efgh', '/ijkl', '/mnop'].forEach((path) => {
      result = route.handles('get', path);
      assert(result, 'Expected ' + path);
    });

    ['HEAD', 'POST', 'PUT', 'DELETE'].forEach((method) => {
      result = route.handles(method, '/abcd');
      assert.isFalse(result, 'But no methods, other than GET');
    });
  });
});

