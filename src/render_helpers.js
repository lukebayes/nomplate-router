const StubWindow = require('./stub_window');

/**
 * Transform a location, URL, href or path into a URL object.
 */
function urlFromString(urlPathOrLocation) {
  let url;
  if (typeof urlPathOrLocation === 'string') {
    if (urlPathOrLocation.indexOf('://') > -1) {
      url = new URL(urlPathOrLocation).pathname;
    } else {
      // Ensure our leading slash is present and singular.
      const part = urlPathOrLocation.indexOf('/') !== 0 ? `/${urlPathOrLocation}` : urlPathOrLocation;
      url = new URL(`http://example.com${part}`);
    }
  } else {
    url = urlPathOrLocation;
  }

  return url;
}

/**
 * This is a default, brute force dom renderer that will simply clobber
 * all children of the root element with whatever tree was returned by
 * the rendering engine.
 *
 * More efficient and completely different renderers can be provided
 * to the router as a configuration option.
 */
function domRenderer(viewName, renderedView, root) {
  if (!root) {
    throw new Error('Cannot render a view without a root element');
  }

  if (!renderedView) {
    throw new Error(`Provided viewHandler for (${viewName}) returned nothing`);
  }

  // Replace root child elements with the rendered view elements.
  root.innerHTML = '';
  root.appendChild(renderedView);

  return renderedView;
}

/**
 * Get the closes anchor to an element that was clicked.
 */
function nearestAnchor(element) {
  const doc = element.ownerDocument;

  while (element && element !== doc) {
    if (element instanceof HTMLAnchorElement) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
}

function shouldTrapClick(router, win, element) {
  return (element.host === win.location.host) &&
    (router.hasRouteFor('get', element.href || '') ||
		router.hasRouteFor('get', element.pathname || ''));
}

/**
 * Trap all click operations from internal anchors so that they instead
 * get pushed into history and handled by the router.
 */
function getClickTrapHandler(router, win) {
  return function _clickTrapHandler(opt_event) {
    const event = opt_event || _win && _win.event;
    let element = event.target || event.srcElement;
    const win = element.ownerDocument && element.ownerDocument.defaultView || _win;

    element = nearestAnchor(element);

    // Bail if we don't have an element or a window.
    if (!element || !win) {
      return;
    }

    if (shouldTrapClick(router, win, element)) {
      const url = element.href || element.pathname;
      event.preventDefault();
      event.stopImmediatePropagation();

      if (event.ctrlKey) {
        if (event.shiftKey) {
          win.open(url, '_blank').focus();
        } else {
          win.open(url, '_target');
        }
        return;
      }

      win.history.pushState(null, null, url);

      if (!router.suppressClickLogging) {
        console.log('NOTE: nomplate-router has captured and blocked an internal-path anchor click for:', element);
        console.log('To suppress this log statement send {suppressClickLogging: true} as an app creation option.');
      }

      return false;
    }
  }
}

/**
 * We don't have any notifications when the history state is changed,
 * so we need to override history.pushState and history.replaceState
 * with custom methods that will update our current route, and call
 * the appropriate handler whenever these methods are called.
 */
function modifyWindowHistory(router, win) {
  const hist = win.history;
  const _pushState = hist.pushState;
  const _replaceState = hist.replaceState;

  function wrapper(original) {
    return function(state, title, url) {
      original.call(hist, state, title, url);
      router.execute(win.location);
    };
  };

  hist.pushState = wrapper(_pushState);
  hist.replaceState = wrapper(_replaceState);
}

/**
 * Trap all anchor clicks on the DOM at the window and prevent internal
 * links from changing URL.
 */
function trapAnchorClicks(router, win) {
  // Trap all internal anchor click events.
  win.document.addEventListener('click', getClickTrapHandler(router), true);
}

/**
 * If we're provided with a real-ish DOM window, update the history
 * and trap clicks.
 *
 * Otherwise, create a stub that can be used in a location-free context
 * like Electron or other native or GL environments.
 */
function windowHelper(router, win) {
  if (win) {
    modifyWindowHistory(router, win);
    trapAnchorClicks(router, win);
  } else {
    win = new StubWindow();
  }

  return win;
}

module.exports = {
  domRenderer,
  modifyWindowHistory,
  urlFromString,
  windowHelper,
  shouldTrapClick,
};

