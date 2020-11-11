const Iterator = require('./iterator');
const Request = require('./request');
const Response = require('./response');
const Route = require('./route');

const DEFAULT_METHOD = 'get';

class App {
  constructor(options) {
    this._options = options || {};
    this._settings = {};
    this._routes = [];
    this._errorRoutes = [];
    this._window;
    this._root = null;
  }

  get suppressClickLogging() {
    return this._options.suppressClickLogging || false;
  }

  set suppressClickLogging(value) {
    this._options.suppressClickLogging = value;
  }

  _getMiddlewareFor(method, path) {
    return this._routes.filter((route) => {
      return !!route.handles(method, path);
    });
  }

  _getErrorHandlers() {
  }

  _resolveHandlers(optHandlers) {
    return optHandlers;
  }

  _createMiddleware(method, path, handlerOrHandlers) {
    return {
      method,
      path,
      handlers: this._resolveHandlers(handlerOrHandlers),
    }
  }

  /**
   * Set the named setting to the provided value.
   */
  set(name, value) {
    this._settings[name] = value;
    return this;
  }

  /**
   * Get the setting value at the provided name.
   */
  _get(name) {
    return this._settings[name];
  }

  /**
   * Disable the boolean setting at the provided name.
   */
  disable(name) {
    return this._settings[name] = false;
  }

  /**
   * Enable the boolean setting at the provided name.
   */
  enable(name) {
    return this._settings[name] = true;
  }

  /**
   * Check the value of the boolean setting at the provided name.
   */
  enabled(name) {
    return !!this._settings[name];
  }

  _pushRoute(method, path, handlers) {
    if (handlers && handlers.length === 1 && Array.isArray(handlers[0])) {
      handlers = handlers[0];
    }

    handlers.forEach((handler) => {
      const route = new Route(method, path, handler);

      if (handler.length !== 4) {
        this._routes.push(route);
      } else {
        this._errorRoutes.push(route);
      }
    });
  }

  /**
   * Register a handler for all methods.
   */
  all(path, ...handlerOrHandlers) {
    this._pushRoute('all', path, handlerOrHandlers);
    return this;
  }

  /**
   * Register a handler for delete methods.
   */
  delete(path, ...handlerOrHandlers) {
    this._pushRoute('delete', path, handlerOrHandlers);
    return this;
  }

  /**
   * Register a handler for get methods.
   */
  get(pathOrName, ...handlerOrHandlers) {
    if (arguments.length === 1) {
      return this._get(pathOrName);
    }

    this._pushRoute('get', pathOrName, handlerOrHandlers);
    return this;
  }

  /**
   * Register a handler for post methods.
   */
  post(path, ...handlerOrHandlers) {
    this._pushRoute('post', path, handlerOrHandlers);
    return this;
  }

  /**
   * Register a handler for put methods.
   */
  put(path, ...handlerOrHandlers) {
    this._pushRoute('put', path, handlerOrHandlers);
    return this;
  }

  /**
   * Register a handler for all methods and paths.
   */
  use(...handlerOrHandlers) {
    this._pushRoute('all', 'all', handlerOrHandlers);
    return this;
  }

  /**
   * Execute middleware for the provided path and method.
   */
  _execute(loc) {
    const path = loc.pathname;
    const req = new Request(this, path, this._window);
    const res = new Response(this, path, this._window);

    // Use an external iterator so that async handlers will work.
    const itr = new Iterator(this._getMiddlewareFor(req.method, path));
    this._executeNext(itr, req, res);
  }

  _executeNext(itr, req, res) {
    while (itr.hasNext()) {
      let isPromise = false;
      const route = itr.next();

      const nextHandler = (err) => {
        if (err) {
          throw new Error('Not yet implemented!!!');
        }

        this._executeNext(itr, req, res);
      };

      // Set the route resolved params onto the request object.
      req.params = route.params;
      if (route.handler.length === 3) {
        route.handler(req, res, nextHandler);
        break;
      } else {
        isPromise = route.handler(req, res);
        if (isPromise && typeof(isPromise.then) === 'function') {
          isPromise.then(nextHandler);
          break;
        }
      }
    }
  }

  /**
   * We don't have any notifications when the history state is changed,
   * so we need to override history.pushState and history.replaceState
   * with custom methods that will update our current route, and call
   * the appropriate handler whenever these methods are called.
   */
  _updateHistory(win) {
    const hist = win.history;
    const _pushState = hist.pushState;
    const _replaceState = hist.replaceState;
    const app = this;

    function wrapper(original) {
      return function(state, title, url) {
        original.call(hist, state, title, url);
        // win.location.replace(url);
        // console.log(Object.keys(win.location.__proto__));
        app._execute(win.location);
      };
    };

    hist.pushState = wrapper(_pushState);
    hist.replaceState = wrapper(_replaceState);

    return win;
  }

  /**
   * Trap all click operations from internal anchors so that they instead
   * get pushed into history and handled by the router.
   */
  _internalAnchorClickTrapHandler(opt_event) {
    const event = opt_event || this._window && this._window.event;
    let element = event.target || event.srcElement;
    const win = event.ownerDocument.defaultView || this._window;

    element = this._nearestAnchor(element);

    // Bail if we don't have an element or a window.
    if (!element || !win) {
      return;
    }

    if (element.host === win.location.host) {
      const pathname = element.pathname;
      event.preventDefault();
      event.stopImmediatePropagation();
      win.history.pushState(null, null, pathname);
      if (!this.suppressClickLogging) {
        console.log('NOTE: nomplate-router has captured and blocked an internal-path anchor click for:', element);
        console.log('To suppress this log statement send {suppressClickLogging: true} as an app creation option.');
      }
    }
  }

  /**
   * Get the closes anchor to an element that was clicked.
   */
  _nearestAnchor(element) {
    const doc = element.ownerDocument;

    while (element && element !== doc) {
      if (element instanceof HTMLAnchorElement) {
        return element;
      }

      element = element.parentElement;
    }

    return null;
  }

  /**
   * Begin listening for route changes on the provided window object.
   */
  listen(win, optRoot) {
    if (!win) {
      throw new Error('listen requires a reference to a Window object');
    }
    if (!optRoot) {
      throw new Error('Must provide a root element for display rendering');
    }
    this._window = this._updateHistory(win);
    this._root = optRoot;

    // Trap all internal anchor click events.
    this._window.document.addEventListener('click', this._internalAnchorClickTrapHandler.bind(this), true);
    this._execute(this._window.location);
  }

  _executeView(input) {
    if (this._settings['view engine']) {
      const engine = this._settings['view engine'];
      return engine(input, this._window.document);
    }

    return input;
  }

  /**
   * Render the view registerd at name with the provided locals.
   */
  render(viewName, optLocals, callback) {
    const view = this._settings['views'][viewName];
    if (!view) {
      throw new Error(`No view registered at ${viewName}, need to provide it to app.set('views', {"${viewName}": viewFunc});`);
    }

    const locals = Object.assign({settings: this._settings}, optLocals);
    const element = this._executeView(view(locals));

    // TODO(lbayes): We should explode if either of these are missing.
    if (this._root && element) {
      this._root.innerHTML = '';
      this._root.appendChild(element);
    }
  }
}

module.exports = App;

