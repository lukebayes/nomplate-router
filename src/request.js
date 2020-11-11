
class Request {
  constructor(app, path, win) {
    this._window = win;
    const loc = win.location;

    this.app = app;
    this.body = {};
    this.cookies = this._getCookies();
    this.hostname = loc.hostname;
    this.originalUrl = loc.url;
    this.path = loc.pathname;
    this.protocol = loc.protocol;
    this.query = this._getQuery();
    this.method = this.query._method || 'get';
    this.params = {};
  }

  _getCookies() {
    const pairs = (this._window.document.cookie || '').split(';');
    return this._parseEncodedPairs(pairs);
  }

  _getQuery() {
    const pairs = this._window.location.search.slice(1).split('&');
    return this._parseEncodedPairs(pairs);
  }

  _parseEncodedPairs(pairs) {
    const result = {};
    pairs.forEach((pair) => {
      if (pair !== '') {
        const parts = pair.split('=');
        result[(unescape(parts[0]) + '').trim()] = unescape(parts.slice(1).join('='));
      }
    });
    return result;
  }
}

module.exports = Request;

