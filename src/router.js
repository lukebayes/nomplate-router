const Iterator = require('./iterator');
const Request = require('./request');
const Response = require('./response');
const Route = require('./route');
const domRenderer = require('./render_helpers').domRenderer;
const windowHelper = require('./render_helpers').windowHelper;
const urlFromString = require('./render_helpers').urlFromString;

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
    this._options = Object.assign(DEFAULT_OPTIONS, options || {});
    this._locals = null;
    this._settings = {};
    this._routes = [];
    this._errorRoutes = [];
    this._window;
    this._rootContext = null;
  }

  get renderer() {
    return this._settings.renderer || this._options.renderer;
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

  _getMiddlewareFor(method, url) {
    return this._routes.filter((route) => {
      return !!route.handles(method, url.pathname || url);
    });
  }

  hasRouteFor(method, url) {
    const handlers = this._getMiddlewareFor(method, url);
    return handlers && handlers.length > 0;
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
    if (Array.isArray(path)) {
      path.forEach((p) => {
        this._pushRoute(method, p, handlers);
      });
      return;
    }

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
   * Register a handler for head methods.
   */
  head(pathOrName, ...handlerOrHandlers) {
    this._pushRoute('head', pathOrName, handlerOrHandlers);
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
   * Navigate to the provided path or location.
   *
   * Calling this function will push the provided url onto the history stack
   * and then execute whatever handler is associated with the path.
   */
  navigate(urlPathOrLocation, opt_method) {
    this.window.history.pushState({}, '', urlPathOrLocation);
  }

  reload() {
    this.window.location.reload();
  }

  redirect(urlPathOrLocation, opt_method) {
    this.window.history.replaceState({}, '', urlPathOrLocation);
  }

  back() {
    this.window.history.back();
  }

  go(delta) {
    this.window.history.go(delta);
  }

  /**
   * Execute middleware for the provided path and method.
   *
   * NOTE: This method will not update the history or the window.location
   */
  execute(urlPathOrLocation, opt_method) {
    // Transform a location, URL, href or path into a URL object.
    const url = urlFromString(urlPathOrLocation);
    const req = new Request(this, url, this.window, opt_method);
    const res = new Response(this, url, this.window);

    // Get pointer to Response.locals so that we can forwad it to views
    this._locals = res.locals;

    // console.log('Router.execute with:', req.method, url.href);
    // Use an external iterator so that async handlers will work.
    const itr = new Iterator(this._getMiddlewareFor(req.method, url));
    this._executeNext(itr, req, res);
  }

  _executeNext(itr, req, res, opt_err) {
    while (itr.hasNext()) {
      let isPromise = false;
      const route = itr.next();

      if (res.isEnded) {
        console.warn("Response has already ended, not executing route:", route.method, route.path);
        return;
      }

      const nextHandler = (err) => {
        if (err) {
          if (this._errorRoutes.length == 0) {
            // Error routes are often configured like this:
            // app.use((req, res, next, err) => {
            //    res.render('error', {err});
            // });
            // As with other routes (or use statements), they will be 
            // called in the order they are registered, until one closes
            // the response by rendering or sending a result.
            throw new Error('There must be at least one error route configured');
          }
          const errItr = new Iterator(this._errorRoutes);
          return this._executeNext(errItr, req, res, err);
        }

        this._executeNext(itr, req, res);
      };

      // Set the route resolved params onto the request object.
      req.params = route.params;

      const handler = route.handler;
      const handlerLen = handler.length;

      if (opt_err) {
        handler(req, res, nextHandler, opt_err);
      } else if (handlerLen === 3) {
        try {
          handler(req, res, nextHandler);
        } catch (err) {
          // Forward the captured error to the nextHandler
          nextHandler(err);
          break;
        }
        break;
      } else {
        isPromise = handler(req, res);
        if (isPromise && typeof(isPromise.then) === 'function') {
          isPromise.catch((err) => {
            // Handle promise errors by getting to the error handler
            return this._executeNext(itr, req, res, err);
          });
          isPromise.then(nextHandler)
          break;
        }
      }
    }
  }

  /**
   * Begin listening for route changes on the provided window object.
   */
  listen(opt_rootContext, opt_win) {
    this._rootContext = opt_rootContext;
    this._window = windowHelper(this, opt_win);

    if (opt_win) {
      opt_win.addEventListener('popstate', (event) => {
        this.execute(opt_win.location);
      });
      this.execute(opt_win.location);
    } else {
      this.execute('/');
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

    const locals = Object.assign(Object.assign({router: this, settings: this._settings}, optLocals), this._locals);
    const renderedView = this._executeView(viewHandler(locals));

    return this.renderer(viewName, renderedView, this.rootContext);
  }
}

module.exports = Router;


