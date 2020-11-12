
class StubLocation {
  constructor(win) {
    this._window = win;
    this._url = null;

    this._defineUrlProperties();
  }

  _defineUrlProperties() {
    [
      'href',
      'protocol',
      'username',
      'password',
      'host',
      'hostname',
      'port',
      'pathname',
      'search',
      'hash',
    ].forEach((name) => {
      Object.defineProperty(this, name, {
        get: () => {
          return this._url[name];
        },
        set: (value) => {
          this._url[name] = value;
        },
      });
    });
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
    this.location = 'https://example.com';
    this.document = new StubDocument(this);
    this.event = null;
    this.isStub = true;
  }

  setUrl(urlOrPath) {
    this.location = urlOrPath;
  }

  set location(urlOrPath) {
    let url;
    // If the host is not included, we have a path.
    if (urlOrPath && urlOrPath.indexOf('://') === -1) {
      // Ensure our leading slash is present and singular.
      const part = urlOrPath.indexOf('/') !== 0 ? `/${urlOrPath}` : urlOrPath;
      url = `https://example.com${part}`;
    } else {
      url = urlOrPath;
    }

    this._location = new StubLocation(this);
    this._location.assign(url);
  }

  get location() {
    return this._location;
  }
}

module.exports = StubWindow;
