const Iterator = require('./iterator');
const Request = require('./request');
const Response = require('./response');
const Route = require('./route');
const domRenderer = require('./render_helpers').domRenderer;
const windowHelper = require('./render_helpers').windowHelper;

const DEFAULT_METHOD = 'get';

const DEFAULT_OPTIONS = {
  renderer: domRenderer,
  root: null,
  suppressClickLogging: false,
};

/**
 * Primary coordinator for routing services.
 */
class Router {
  constructor(options) {
    this._options = Object.assign(options || {}, DEFAULT_OPTIONS);
    this._settings = {};
    this._routes = [];
    this._errorRoutes = [];
    this._window;
    this._rootContext = null;
  }

  get renderer() {
    return this._options.renderer;
  }

  get rootContext() {
    return this._rootContext;
  }

  get suppressClickLogging() {
    return this._options.suppressClickLogging;
  }

  set suppressClickLogging(value) {
    this._options.suppressClickLogging = value;
  }

  get window() {
    return this._window;
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
  execute(pathname) {
    const req = new Request(this, pathname, this.window);
    const res = new Response(this, pathname, this.window);

    // Use an external iterator so that async handlers will work.
    const itr = new Iterator(this._getMiddlewareFor(req.method, pathname));
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
   * Begin listening for route changes on the provided window object.
   */
  listen(rootContext, win) {
    if (!rootContext) {
      throw new Error('Must provide a rootContext that will be passed to the renderer.');
    }
    this._rootContext = rootContext;
    this._window = windowHelper(this, win);

    if (win) {
      this.execute(win.location.pathname);
    }
  }

  _executeView(input) {
    if (this._settings['view engine']) {
      const engine = this._settings['view engine'];
      return engine(input, this.window.document);
    }

    return input;
  }

  /**
   * Render the view registerd at name with the provided locals.
   */
  render(viewName, optLocals, callback) {
    const viewHandler = this._settings['views'][viewName];
    if (!viewHandler) {
      throw new Error(`No viewHandler registered at ${viewName}, need to provide it to routes.set('views', {"${viewName}": viewFunc});`);
    }

    const locals = Object.assign({router: this, settings: this._settings}, optLocals);
    const renderedView = this._executeView(viewHandler(locals));

    return this.renderer(this.rootContext, viewName, renderedView);
  }
}

module.exports = Router;


