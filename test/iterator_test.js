const assert = require('chai').assert;
const Iterator = require('..').Iterator;

describe('Iterator', () => {

  it('loads an array', () => {
    const itr = new Iterator(['a', 'b', 'c']);
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'a');
    assert.equal(itr.next(), 'a');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'b');
    assert.equal(itr.next(), 'b');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'c');
    assert.equal(itr.next(), 'c');
    assert.isFalse(itr.hasNext());
  });

  it('loads an object', () => {
    const itr = new Iterator({
      a: 1234,
      b: 5678,
      c: 9101,
    });
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'a');
    assert.equal(itr.next(), 'a');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'b');
    assert.equal(itr.next(), 'b');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'c');
    assert.equal(itr.next(), 'c');
    assert.isFalse(itr.hasNext());
  });

  it('loads a string', () => {
    const itr = new Iterator('abc');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'a');
    assert.equal(itr.next(), 'a');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'b');
    assert.equal(itr.next(), 'b');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'c');
    assert.equal(itr.next(), 'c');
    assert.isFalse(itr.hasNext());
  });

  it('loads arbitrary arguments', () => {
    const itr = new Iterator('a', 'b', 'c');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'a');
    assert.equal(itr.next(), 'a');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'b');
    assert.equal(itr.next(), 'b');
    assert(itr.hasNext());
    assert.equal(itr.peek(), 'c');
    assert.equal(itr.next(), 'c');
    assert.isFalse(itr.hasNext());
  });

  it('handles undefined input', () => {
    const itr = new Iterator();
    assert.isFalse(itr.hasNext());
    assert.isUndefined(itr.peek());
  });

  it('handles null input', () => {
    const itr = new Iterator(null);
    assert.isFalse(itr.hasNext());
    assert.isUndefined(itr.peek());
  });

  it('handles out of bounds next', () => {
    const itr = new Iterator('abcd');
    itr.next();
    itr.next();
    itr.next();
    itr.next();
    assert.isFalse(itr.hasNext());
    assert.equal(itr.next(), undefined);
  });

  it('resets', () => {
    const itr = new Iterator('abcd');
    itr.next();
    itr.next();
    assert.equal(itr.next(), 'c');
    itr.reset();
    assert.equal(itr.next(), 'a');
  });
});
