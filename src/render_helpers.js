const StubWindow = require('./stub_window');

/**
 * This is a default, brute force dom renderer that will simply clobber
 * all children of the root element with whatever tree was returned by
 * the rendering engine.
 *
 * More efficient and completely different renderers can be provided
 * to the router as a configuration option.
 */
function domRenderer(root, viewName, renderedView) {
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

/**
 * Trap all click operations from internal anchors so that they instead
 * get pushed into history and handled by the router.
 */
function getClickTrapHandler(router, win) {
  return function _clickTrapHandler(opt_event) {
    const event = opt_event || win && win.event;
    let element = event.target || event.srcElement;
    const win = element.ownerDocument && element.ownerDocument.defaultView || win;

    element = nearestAnchor(element);

    // Bail if we don't have an element or a window.
    if (!element || !win) {
      return;
    }

    if (element.host === win.location.host) {
      const pathname = element.pathname;
      event.preventDefault();
      event.stopImmediatePropagation();

      win.history.pushState(null, null, pathname);

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
      // win.location.replace(url);
      // console.log(Object.keys(win.location.__proto__));
      router.execute(win.location.pathname);
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
  windowHelper,
  modifyWindowHistory,
};
