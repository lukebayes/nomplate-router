
/**
 * Iterator over Arrays, Strings or Object keys.
 *
 * Useful for asynchronous iteration where you need to operate
 * over a collection of entries over time.
 */
class Iterator {

  constructor(...listOrValues) {
    this._index = 0;
    this._list = [];

    if (listOrValues.length === 1 && listOrValues[0]) {
      const first = listOrValues[0];
      if (typeof(first) === 'string') {
        this._list = first.split('');
      } else if (Array.isArray(first)) {
        this._list = first;
      } else if (typeof(first) === 'object') {
        this._list = Object.keys(first);
      }
    } else if (listOrValues.length > 0 && listOrValues[0]) {
      this._list = listOrValues;
    }
  }

  /**
   * Get the next entry without incrementing the counter.
   */
  peek() {
    return this._list[this._index];
  }

  /**
   * Return boolean true if there is an other entry in the list.
   *
   * NOTE: List entries may be null or undefined, this method
   * returns a value based on the input list.length field.
   */
  hasNext() {
    return this._list.length >= this._index + 1;
  }

  /**
   * Get the next entry and increment the counter.
   */
  next() {
    return this._list[this._index++];
  }

  /**
   * Reset the counter and start again.
   */
  reset() {
    this._index = 0;
  }
}

module.exports = Iterator;

