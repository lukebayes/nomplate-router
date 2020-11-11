const pathToRegexp = require('path-to-regexp');

const ALL = 'all';
const DEFAULT_METHOD = 'get';
const REGEX_OPTIONS = {};

class Route {
  constructor(method, path, handler) {
    this.method = (method || DEFAULT_METHOD).toLowerCase();
    this.path = path;
    this.handler = handler;
    this.keys = [];
    this.isError = handler.length === 4;
    this.params = {};
    this._regex =  pathToRegexp(this.path, this.keys, REGEX_OPTIONS);
  }

  handlesMethod(method) {
    if (this.method === ALL) {
      return true;
    }

    return this.method === method.toLowerCase();
  }

  handlesPath(path) {
    if (this.path == ALL) {
      return true;
    }

    const match = this._regex.exec(path);

    if (match) {
      // We have a match, update our params to the matched
      // keys. This is admittedly ugly, in that we're mutating
      // state on a get call, but it's easy for now...
      this.params = {};
      this.keys.forEach((key, index) => {
        this.params[key.name] = match[index + 1];
      });

      return true;
    }

    return false;
  }

  handles(method, path) {
    return this.handlesMethod(method) && this.handlesPath(path);
  }
}

module.exports = Route;

