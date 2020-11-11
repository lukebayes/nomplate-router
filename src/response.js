const DEFAULT_STATUS = 200;

class Response {
  constructor(app, path, win) {
    this.app = app;
    this._window = win;
    this._isEnded = false;
    this._statusCode = null;
    this.locals = {};
  }

  get isEnded() {
    return this._isEnded;
  }

  render(view, optLocals, optCallback) {
    this.end();
    return this.app.render(view, optLocals, optCallback);
  }

  send(element) {
    this.end();
    throw new Error('Not yet implemented');
  }

  clearCookie() {
    this._window.document.cookie = '';
  }

  cookie(key, value) {
    const str = `${escape(key)}=${escape(value)}`;
    if (this._window.document.cookie !== '') {
      this._window.document.cookie += `;${str}`;
    } else {
      this._window.document.cookie = str;
    }
  }

  end() {
    this._isEnded = true;
  }

  status(code) {
    this._statusCode = code;
    return this;
  }

  redirect(optStatusOrPath, optPath) {
    let status, path;
    if (typeof(optStatusOrPath) === 'number') {
      status = optStatusOrPath;
      path = optPath;
    } else {
      status = DEFAULT_STATUS;
      path = optStatusOrPath;
    }

    this.end();

    throw new Error('Not yet implemented');

    return this;
  }
}

module.exports = Response;

