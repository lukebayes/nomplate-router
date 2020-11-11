const Router = require('./router');
const Iterator = require('./iterator');
const Request = require('./request');
const Response = require('./response');
const Route = require('./route');

function create(options) {
  return new Router(options);
};

create.Router = Router;
create.Iterator = Iterator;
create.Request = Request;
create.Response = Response;
create.Route = Route;

module.exports = create;

