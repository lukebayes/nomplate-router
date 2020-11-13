const DEFAULT_STATUS = 200;

class Response {
  constructor(routes, url, win) {
    this._routes = routes;
    this._window = win;
    this._isEnded = false;
    this._statusCode = null;
    this.locals = {};
  }

  get window() {
    return this._window;
  }

  get isEnded() {
    return this._isEnded;
  }

  get routes() {
    return this._routes;
  }

  render(view, optLocals, optCallback) {
    this.end();
    return this.routes.render(view, optLocals, optCallback);
  }

  send(element) {
    this.end();
    throw new Error('Not yet implemented');
  }

  clearCookie() {
    this.window.document.cookie = '';
  }

  cookie(key, value) {
    const str = `${escape(key)}=${escape(value)}`;
    if (this.window.document.cookie !== '') {
      this.window.document.cookie += `;${str}`;
    } else {
      this.window.document.cookie = str;
    }
  }

  end() {
    if (this.isEnded) {
      throw new Error('This response has already ended, cannot end again');
    }
    this._isEnded = true;
  }

  status(code) {
    this._statusCode = code;
    return this;
  }

  redirect(path) {
    this.end();
    this.routes.execute(path);

    return this;
  }
}

module.exports = Response;

