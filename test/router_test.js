const assert = require('chai').assert;
const router = require('../');
const sinon = require('sinon');
const testHelper = require('nomplate/test_helper');

describe('Router Test', () => {

  describe('with location', () => {
    let instance, win, root, doc;

    const view1 = sinon.spy((options) => {
      const element = doc.createElement('div');
      element.id = 'abcd';
      element.textContent = 'Hello World: ' + options.foo;
      return element;
    });

    const view2 = sinon.spy((options) => {
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

      instance = router();
      instance.set('views', {
        abcd: view1,
        efgh: view2,
      });
    });

    describe('api', () => {
      it('has expected handles', () => {
        assert(instance.delete);
        assert(instance.get);
        assert(instance.post);
        assert(instance.put);
        assert(instance.set);
        assert(instance.use);
      });
    });

    describe('routes', () => {
      it('selects from 2 rouetes', () => {
        const one = sinon.spy();
        const two = sinon.spy();

        instance.get('/abcd', one);
        instance.get('/efgh', two);

        win.setUrl('/efgh');
        instance.listen(root, win);

        assert.equal(one.callCount, 0);
        assert.equal(two.callCount, 1);
      });
    });

    describe('request', () => {
      it('calls window.location.pathname handler', (done) => {
        win.setUrl('https://example.com/abcd');

        const routeHandler = sinon.spy();

        instance.get('/abcd', routeHandler).listen(root, win);
        assert.equal(routeHandler.callCount, 1);
        const call = routeHandler.getCall(0);
        const req = call.args[0];
        const res = call.args[1];

        assert.equal(req.routes, instance);
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
          assert.equal(req.routes, instance);
          assert.equal(req.cookies.secret, 'do not tell you 10%');
          assert.equal(req.cookies.last_visit, '1225445171794');
          assert.equal(req.hostname, 'abcd.com');
          assert.equal(req.method, 'get');
          assert.equal(req.path, '/abcd');
          assert.equal(req.query.efgh, '1234');
          assert.equal(req.query['ij kl'], '56 78');

          // Verify response
          assert.equal(res.routes, instance);
          assert.equal(Object.keys(res.locals).length, 0);
          res.cookie('ab cd', 'ef gh');
          assert.equal(win.document.cookie, encodedCookie + ';ab%20cd=ef%20gh');
          res.clearCookie();
          assert.equal(win.document.cookie, '');

          const result = res.status(300);
          assert.equal(result, res);
        });

        instance.get('/abcd', routeHandler).listen(root, win);
      });

      it('applies route params to request', () => {
        win.setUrl('/abcd/efgh/ijkl');

        const one = sinon.spy();
        const two = sinon.spy();
        instance.get('/abcd/:one/:two', one);
        instance.get('/efgh', two);

        instance.listen(root, win);

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

        instance.get('/abcd/efgh', [one, two, three]);
        instance.listen(root, win);

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

        instance.use(one)
        instance.use(two);
        instance.get('/abcd', three);
        instance.get('/efgh', four);
        instance.listen(root, win);

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

        instance.use(one, two, three);
        instance.listen(root, win);

        assert.equal(one.callCount, 1);
        assert.equal(two.callCount, 1);
        assert.equal(three.callCount, 1);
      });

      it('assigns single array of handlers', () => {
        win.setUrl('/abcd');

        const one = sinon.spy();
        const two = sinon.spy();
        const three = sinon.spy();

        instance.use([one, two, three]);
        instance.listen(root, win);

        assert.equal(one.callCount, 1);
        assert.equal(two.callCount, 1);
        assert.equal(three.callCount, 1);
      });

      it('holds request for async middleware', () => {
        win.setUrl('/abcd');
        const one = (req, res, next) => {};
        const two = sinon.spy();

        instance.use(one, two);
        instance.listen(root, win);

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

        instance.use(one, two, three);
        instance.listen(root, win);

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

        instance.use(one, two);
        instance.listen(root, win);

        assert.equal(one.callCount, 1);
        assert.equal(two.callCount, 0);
      });
    });

    describe('views', () => {
      it('renders a view', () => {
        win.setUrl('/abcd');

        instance.get('/abcd', (req, res) => {
          res.render('abcd', {foo: 'efgh'});
        });

        instance.listen(root, win);

        const viewElement = doc.getElementById('abcd');
        assert(viewElement, 'Expected a view element');
      });

      it('processes query params', () => {
        win.setUrl('/abcd?efgh=ijkl');

        instance.get('/abcd', (req, res) => {
          res.render('abcd', {foo: req.query.efgh});
        });

        instance.listen(root, win);

        let viewElement = doc.getElementById('abcd');
        assert.match(viewElement.outerHTML, /Hello World: ijkl/);

        // TODO(lbayes): Should this require directly accessing the router?
        instance.execute('/abcd?efgh=mnop');
        // win.setUrl('/abcd?efgh=mnop');

        viewElement = doc.getElementById('abcd');
        assert.match(viewElement.outerHTML, /Hello World: mnop/);
      });

      it('replaces with multiple views', () => {
        win.setUrl('/abcd');

        instance.get('/abcd', (req, res) => {
          res.render('abcd', {foo: 'abcd'});
        });

        instance.get('/efgh', (req, res) => {
          res.render('efgh', {bar: 'efgh'});
        });

        instance.listen(root, win);

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
          instance[method]('/abcd', sinon.spy());
        });
      });
    });

    describe('settings', () => {
      it('sets and gets', () => {
        instance.set('abcd', 1234);
        assert.equal(instance.get('abcd'), 1234);
      });

      it('disables unknown setting', () => {
        instance.disable('abcd');
        assert.equal(instance.get('abcd'), false);
      });

      it('enables unknown setting', () => {
        instance.enable('abcd');
        assert.equal(instance.get('abcd'), true);
      });

      it('returns boolean setting at enabled', () => {
        assert.equal(instance.enabled('abcd'), false);
        instance.enable('abcd');
        assert.equal(instance.enabled('abcd'), true);
      });
    });
  });

  describe('without DOM/Window or Location', () => {
    let instance, root;

    // This is a custom view.
    function view1(options) {
      return `rendered: ${options.abcd}`;
    };

    // This is another custom view.
    function view2(options) {
      return `rendered: ${options.abcd}`;
    };

    // This is a custom renderer (what attaches the rendered views to a context).
    function renderer(viewName, renderedView, rootContext) {
      root.push(renderedView);
    };

    beforeEach(() => {
      root = [];

      instance = router({
        // Register the custom renderer with the router.
        // Could also choose to register with:
        // instance.set('renderer', renderer);
        renderer,
      });

      // Register the avaiable views with the router.
      instance.set('views', {
        abcd: view1,
        efgh: view2,
      });

      // Register a default and named route handler.
      instance.get(['/', '/abcd'], (req, res) => {
        res.render('abcd', {abcd: '1234'});
      });

      // Register a second route handler.
      instance.get('/efgh', (req, res) => {
        res.render('efgh', {abcd: '5678'});
      });

      instance.listen(root);
    });

    it('executes user-provided custom views and renderer', () => {
      assert.equal(root[0], 'rendered: 1234');
      instance.execute('/efgh');
      assert.equal(root[1], 'rendered: 5678');
      instance.execute('/abcd');
      assert.equal(root[2], 'rendered: 1234');
    });
  });
});
