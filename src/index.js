const Iterator = require('./iterator');
const Request = require('./request');
const Response = require('./response');
const Route = require('./route');
const Router = require('./router');
const StubWindow = require('./stub_window');
const renderHelpers = require('./render_helpers');

function create(options) {
  return new Router(options);
};

create.Iterator = Iterator;
create.Request = Request;
create.Response = Response;
create.Route = Route;
create.Router = Router;
create.StubWindow = StubWindow;
create.renderHelpers = renderHelpers;

module.exports = create;

