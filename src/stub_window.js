

class StubLocation {
  constructor(win) {
    this._window = win;
    this._url = null;
  }

  get href() {
    return this._url.href;
  }

  get protocol() {
    return this._url.protocol;
  }

  get username() {
    return this._url.username;
  }

  get password() {
    return this._url.password;
  }

  get host() {
    return this._url.host;
  }

  get hostname() {
    return this._url.hostname;
  }

  get port() {
    return this._url.port;
  }

  get pathname() {
    return this._url.pathname;
  }

  get search() {
    return this._url.search;
  }

  get hash() {
    return this._url.hash;
  }

  assign(url) {
    this._url = new URL(url);
  }

  replace(url) {
    this._href = url;
  }

  reload() {
    // trigger an update on the router.
  }

  toString() {
    return this._url.toString();
  }
}

class StubDocument {
  constructor(win) {
    this.defaultView = win;
    this.cookie = '';
  }
}

class StubWindow {
  constructor(router) {
    this._router = router;
    this._location = new StubLocation(this);
    this.document = new StubDocument(this);
    this.event = null;
  }

  set location(href) {
    this._location = new StubLocation(this);
    this._location.assign(href);
  }

  get location() {
    return this._location;
  }
}

module.exports = StubWindow;
