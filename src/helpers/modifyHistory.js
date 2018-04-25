import _ from 'lodash';

import store from 'store';
import { actions as systemActions } from 'store/system';
import { actions as pagesActions } from 'store/pages';

import temps from 'temps';

export default function modifyHistory(history) {
  if (history.wModified) return;
  history.wModified = true;
  history.entries = [window.location.href];

  history.validate = (path) => {
    return path;
  };

  history.dispatch = (href) => {
    let path = href;
    let searchs = null;
    if (href.indexOf('?') !== -1) {
      path = href.substr(0, href.indexOf('?'));
      searchs = {};
      const search = href.substr(href.indexOf('?') + 1);
      _.each(search.split(';'), (part) => {
        const parts = part.split('=');
        searchs[parts[0]] = parts[1];
      });
    }

    let wChanged = false;
    let parentPaths = [];
    for (let pathC = path; pathC; pathC = pathC.slice(0, pathC.lastIndexOf('/'))) {
      parentPaths = [pathC, ...parentPaths];
    }
    path = parentPaths[0];
    for (;;) {
      const node = store.pages[path];
      if (!node) break;
      const { onRouteCheck } = temps.pages[path];
      if (onRouteCheck) {
        const ret = onRouteCheck(node.$self, store);
        if (ret && ret !== path) {
          path = ret;
          wChanged = true;
          continue;
        }
      }
      if (wChanged) break;
      const index = parentPaths.indexOf(path) + 1;
      if (index >= parentPaths.length) break;
      path = parentPaths[index];
    }
    if (wChanged) history.replaceB(path);
    systemActions.routeTo(path, searchs);
    pagesActions.routeTo(path, searchs);
  };

  history.replaceB = history.replace;
  history.replace = (path) => {
    history.entries.pop();
    history.entries.push(path);
    history.replaceB(history.validate(path));
  };

  history.pushB = history.push;
  history.push = (path) => {
    history.entries.push(path);
    history.pushB(history.validate(path));
  };

  history.goBackB = history.goBack;
  history.goBack = (backTo) => {
    if (!backTo) {
      history.goBackB();
      return;
    }
    const last = history.entries[history.entries - 1];
    if (last === backTo) {
      history.entries.pop();
      history.goBackB();
    } else {
      history.replace(backTo);
    }
  };
}
