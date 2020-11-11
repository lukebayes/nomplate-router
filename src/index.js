const App = require('./app');
const Iterator = require('./iterator');
const Request = require('./request');
const Response = require('./response');
const Route = require('./route');

function createApp(options) {
  return new App(options);
};

createApp.App = App;
createApp.Iterator = Iterator;
createApp.Request = Request;
createApp.Response = Response;
createApp.Route = Route;

module.exports = createApp;

