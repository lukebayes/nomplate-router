const StubWindow = require('../').StubWindow;
const assert = require('chai').assert;
const sinon = require('sinon');
const router = require('../');

describe('StubWindow Test', () => {
  let instance, routes;

  function assertProperty(url, propertyName, expectedValue) {
    instance.location = url;
    assert.equal(instance.location[propertyName], expectedValue);
  }

  beforeEach(() => {
    routes = router();
    instance = new StubWindow(routes);
  });

  it('is instantiable', () => {
    assert(instance);
  });

  it('assigns href', () => {
    assertProperty('https://example.com', 'href', 'https://example.com/');
  });

  it('assigns protocol', () => {
    assertProperty('https://example.com', 'protocol', 'https:');
    assertProperty('eightamps://example.com', 'protocol', 'eightamps:');
  });

  it('assigns username', () => {
    assertProperty('https://foo:bar@example.com', 'username', 'foo');
  });

  it('assigns password', () => {
    assertProperty('https://foo:bar@example.com', 'password', 'bar');
  });

  it('assigns host', () => {
    assertProperty('https://foo:bar@example.com', 'host', 'example.com');
    assertProperty('https://www.example.com', 'host', 'www.example.com');
  });

  it('assigns hostname', () => {
    assertProperty('https://www.example.com', 'host', 'www.example.com');
  });

  it('assigns port', () => {
    assertProperty('https://www.example.com', 'port', '');
    assertProperty('https://www.example.com:1234', 'port', '1234');
  });

  it('assigns pathname', () => {
    assertProperty('https://www.example.com', 'pathname', '/');
    assertProperty('https://www.example.com/abcd/efgh', 'pathname', '/abcd/efgh');
  });

  it('assigns search', () => {
    assertProperty('https://www.example.com', 'search', '');
    assertProperty('https://www.example.com?abcd=efgh', 'search', '?abcd=efgh');
  });

  it('assigns hash', () => {
    assertProperty('https://www.example.com', 'hash', '');
    assertProperty('https://www.example.com#/ijkl/mnop', 'hash', '#/ijkl/mnop');
    assertProperty('https://www.example.com?abcd=efgh', 'hash', '');
    assertProperty('https://www.example.com?abcd=efgh#ijkl=mnop', 'hash', '#ijkl=mnop');
  });

  it('renders as a string', () => {
    instance.location = 'https://example.com';
    assert.equal(instance.location.toString(), 'https://example.com/');
  });

  it('throws with empty location', () => {
    assert.throws(() => {
      instance.location = null;
    }, /Invalid URL/);
  });
});
