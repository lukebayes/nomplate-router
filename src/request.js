const urlFromString = require('./render_helpers').urlFromString;

class Request {
  constructor(routes, url, win, opt_method) {
    this._window = win;
    if (typeof url === 'string') {
      url = urlFromString(url);
    }

    this.routes = routes;
    this.body = {};
    this.cookies = this._getCookies();
    this.hostname = url.hostname;
    this.originalUrl = url.href;
    this.path = url.pathname;
    this.protocol = url.protocol;
    this.query = this._getQuery(url.search);
    this.method = opt_method || this.query._method || 'get';
    this.params = {};
  }

  get window() {
    return this._window;
  }

  _getCookies() {
    const pairs = (this.window && this.window.document.cookie || '').split(';');
    return this._parseEncodedPairs(pairs);
  }

  _getQuery(search) {
    const pairs = search.slice(1).split('&');
    return this._parseEncodedPairs(pairs);
  }

  _coerce(value) {
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    }
    return value;
  }

  _parseEncodedPairs(pairs) {
    const result = {};
    pairs.forEach((pair) => {
      if (pair !== '') {
        const parts = pair.split('=');
        const key = (unescape(parts[0]) + '').trim();
        const value = unescape(parts.slice(1).join('='));
        result[key] = this._coerce(value);
      }
    });
    return result;
  }
}

module.exports = Request;

