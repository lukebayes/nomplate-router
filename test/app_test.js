const assert = require('chai').assert;
const router = require('../');
const sinon = require('sinon');
const testHelper = require('nomplate/test_helper');
const renderElement = require('nomplate').renderElement;

describe('Router App', () => {
  let app, win, root, doc;

  const abcdView = sinon.spy((options) => {
    const element = doc.createElement('div');
    element.id = 'abcd';
    element.textContent = 'Hello World: ' + options.foo;
    return element;
  });

  const efghView = sinon.spy((options) => {
    const element = doc.createElement('div');
    element.id = 'efgh';
    element.textContent = 'World Hello: ' + options.bar;
    return element;
  });

  beforeEach(() => {
    win = testHelper.createWindow({url: 'http://example.com'});
    doc = win.document;
    root = doc.createElement('div');
    root.className = 'app-root';
    root.textContent = 'root';
    doc.body.appendChild(root);

    app = router();
    app.set('views', {
      abcd: abcdView,
      efgh: efghView,
    });
  });

  describe('api', () => {
    it('has expected handles', () => {
      assert(app.delete);
      assert(app.get);
      assert(app.post);
      assert(app.put);
      assert(app.set);
      assert(app.use);
    });
  });

  describe('routes', () => {

    it('selects from 2 rouetes', () => {
      const one = sinon.spy();
      const two = sinon.spy();

      app.get('/abcd', one);
      app.get('/efgh', two);

      win.setUrl('/efgh');
      app.listen(win, root);

      assert.equal(one.callCount, 0);
      assert.equal(two.callCount, 1);
    });
  });

  describe('request', () => {
    it('calls window.location.pathname handler', (done) => {
      win.setUrl('https://example.com/abcd');

      const routeHandler = sinon.spy();

      app.get('/abcd', routeHandler).listen(win, root);
      assert.equal(routeHandler.callCount, 1);
      const call = routeHandler.getCall(0);
      const req = call.args[0];
      const res = call.args[1];

      assert.equal(req.app, app);
      assert(req.body);
      done();
    });

    it('provides cookies, hostname, method to reqest', () => {
      win.setUrl('https://abcd.com/abcd?efgh=1234&ij%20kl=56%2078');

      const encodedCookie = 'secret=do%20not%20tell%20you%2010%;last_visit=1225445171794';
      Object.defineProperty(win.document, 'cookie', {
        value: encodedCookie,
        writable: true,
      });

      const routeHandler = sinon.spy((req, res) => {
        // Verify request
        assert.equal(req.app, app);
        assert.equal(req.cookies.secret, 'do not tell you 10%');
        assert.equal(req.cookies.last_visit, '1225445171794');
        assert.equal(req.hostname, 'abcd.com');
        assert.equal(req.method, 'get');
        assert.equal(req.path, '/abcd');
        assert.equal(req.query.efgh, '1234');
        assert.equal(req.query['ij kl'], '56 78');

        // Verify response
        assert.equal(res.app, app);
        assert.equal(Object.keys(res.locals).length, 0);
        res.cookie('ab cd', 'ef gh');
        assert.equal(win.document.cookie, encodedCookie + ';ab%20cd=ef%20gh');
        res.clearCookie();
        assert.equal(win.document.cookie, '');

        const result = res.status(300);
        assert.equal(result, res);
      });

      app.get('/abcd', routeHandler).listen(win, root);
    });

    it('applies route params to request', () => {
      win.setUrl('/abcd/efgh/ijkl');

      const one = sinon.spy();
      const two = sinon.spy();
      app.get('/abcd/:one/:two', one);
      app.get('/efgh', two);

      app.listen(win, root);

      assert.equal(one.callCount, 1);
      const callArgs = one.getCall(0).args;
      const req = callArgs[0];
      assert.equal(req.params.one, 'efgh');
      assert.equal(req.params.two, 'ijkl');
      assert.equal(two.callCount, 0);
    });

    it('assigns multiple handlers on get', () => {
      win.setUrl('/abcd/efgh');
      const one = sinon.spy();
      const two = sinon.spy();
      const three = sinon.spy();

      app.get('/abcd/efgh', [one, two, three]);
      app.listen(win, root);

      assert.equal(one.callCount, 1);
      assert.equal(two.callCount, 1);
      assert.equal(three.callCount, 1);
    });

    it('assigns use routes to all paths and methods', () => {
      win.setUrl('/abcd');

      const one = sinon.spy();
      const two = sinon.spy();
      const three = sinon.spy();
      const four = sinon.spy();

      app.use(one)
      app.use(two);
      app.get('/abcd', three);
      app.get('/efgh', four);
      app.listen(win, root);

      assert.equal(one.callCount, 1);
      assert.equal(two.callCount, 1);
      assert.equal(three.callCount, 1);
      assert.equal(four.callCount, 0);
    });

    it('assigns multiple use handlers', () => {
      win.setUrl('/abcd');

      const one = sinon.spy();
      const two = sinon.spy();
      const three = sinon.spy();

      app.use(one, two, three);
      app.listen(win, root);

      assert.equal(one.callCount, 1);
      assert.equal(two.callCount, 1);
      assert.equal(three.callCount, 1);
    });

    it('assigns single array of handlers', () => {
      win.setUrl('/abcd');

      const one = sinon.spy();
      const two = sinon.spy();
      const three = sinon.spy();

      app.use([one, two, three]);
      app.listen(win, root);

      assert.equal(one.callCount, 1);
      assert.equal(two.callCount, 1);
      assert.equal(three.callCount, 1);
    });

    it('holds request for async middleware', () => {
      win.setUrl('/abcd');
      const one = (req, res, next) => {};
      const two = sinon.spy();

      app.use(one, two);
      app.listen(win, root);

      assert.equal(two.callCount, 0, 'One never ended');
    });

    it('calls subsequent async requests', (done) => {
      win.setUrl('/abcd');
      const one = sinon.spy((req, res, next) => {
        setTimeout(() => {
          next();
        });
      });

      const two = sinon.spy((req, res, next) => {
        setTimeout(() => {
          next();
        });
      });

      const three = sinon.spy((req, res, next) => {
        setTimeout(() => {
          next();
          assert.equal(two.callCount, 1);
          // Exit the test
          done();
        });
      });

      app.use(one, two, three);
      app.listen(win, root);

      assert.equal(one.callCount, 1);
      assert.equal(two.callCount, 0);
      assert.equal(three.callCount, 0);
    });

    it('runs promise return values like async', (done) => {
      const one = sinon.spy((req, res) => {
        return {
          // Fake promise:
          then: (handler) => {
            setTimeout(() => {
              handler();
            });
          }
        }
      });

      const two = sinon.spy((req, res) => {
        done();
      });

      app.use(one, two);
      app.listen(win, root);

      assert.equal(one.callCount, 1);
      assert.equal(two.callCount, 0);
    });
  });

  describe('views', () => {
    it('renders a view', () => {
      win.setUrl('/abcd');

      app.get('/abcd', (req, res) => {
        res.render('abcd', {bar: 'efgh'});
      });

      app.listen(win, root);

      const viewElement = doc.getElementById('abcd');
      assert(viewElement, 'Expected a view element');
    });

    it('replaces with multiple views', () => {
      win.setUrl('/abcd');

      app.get('/abcd', (req, res) => {
        res.render('abcd', {foo: 'abcd'});
      });

      app.get('/efgh', (req, res) => {
        res.render('efgh', {bar: 'efgh'});
      });

      app.listen(win, root);

      assert.equal(doc.body.textContent, 'Hello World: abcd');

      // win.history.pushState(null, null, '/efgh');
      // assert.equal(doc.body.textContent, 'World Hello: abcd');

      /*
       * NOTE(lbayes): This works in a browser, but JSDOM no longer
       * manages navigation events properly.
      assert.equal(viewTwo.callCount, 1);
      const localsTwo = viewTwo.getCall(0).args[0];
      assert.equal(localsTwo.bar, 'mnop');
      assert.equal(doc.body.textContent, 'World Hello: mnop');
       */
    });
  });

  describe('handlers types', () => {
    ['get', 'put', 'post', 'delete', 'all'].forEach((method) => {
      it(`works with ${method}`, () => {
        app[method]('/abcd', sinon.spy());
      });
    });
  });

  describe('settings', () => {
    it('sets and gets', () => {
      app.set('abcd', 1234);
      assert.equal(app.get('abcd'), 1234);
    });

    it('disables unknown setting', () => {
      app.disable('abcd');
      assert.equal(app.get('abcd'), false);
    });

    it('enables unknown setting', () => {
      app.enable('abcd');
      assert.equal(app.get('abcd'), true);
    });

    it('returns boolean setting at enabled', () => {
      assert.equal(app.enabled('abcd'), false);
      app.enable('abcd');
      assert.equal(app.enabled('abcd'), true);
    });
  });
});
