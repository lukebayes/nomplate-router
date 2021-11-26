const assert = require('chai').assert;
const router = require('..');
const helpers = require('..').renderHelpers;

describe('renderHelpers', () => {

  describe('shouldTrapClick', () => {
    it('should not trap mismatched hosts', () => {
      const fakeElem = {host: 'https://example.com'};
      const fakeWin = {location: {host: 'https://foo.com'}};

      assert.isFalse(helpers.shouldTrapClick(null, fakeWin, fakeElem), 'Should not trap click');
    });

    it('should not trap missing route', () => {
      const r = router();
      const fakeElem = {host: 'https://example.com', pathname: '/abcd'};
      const fakeWin = {location: {host: 'https://example.com'}};

      assert.isFalse(helpers.shouldTrapClick(r, fakeWin, fakeElem), 'Expected no trap');
    });

    it('should trap existing route', () => {
      const r = router();
      r.get('/abcd', (req, res, next) => {});

      const fakeElem = {host: 'https://example.com', pathname: '/abcd'};
      const fakeWin = {location: {host: 'https://example.com'}};

      assert.isTrue(helpers.shouldTrapClick(r, fakeWin, fakeElem), 'Expected trap');
    });
  });
});

