import { autorun, observable, toJS } from 'mobx';
import ls from 'localStorage';
import _ from 'lodash';

import store from 'store';
import temps from 'temps';

const defaultSystem = {
  subpages: {
    _def: {},
  },
  scrollTop: 0,
  scrollLeft: 0,
};

export const initialState = {};

export const serialize = obj => ({});

export const actions = {

  initPage: ({
    path,
    defaultProps,
    serialize = obj => obj,
    deserialize = obj => obj,
  }) => {
    return ({ state }) => {
      state[path] = {};
      const node = state[path];
      if (ls.getItem(`page_${path}`)) {
        const obj = JSON.parse(ls.getItem(`page_${path}`));
        obj.$self = deserialize(obj.$self);
        node.$self = observable({
          ...defaultProps,
          ..._.pick(obj.$self, Object.keys(defaultProps)),
        });
        node.$system = observable({
          ...defaultSystem,
          ..._.pick(obj.$system, Object.keys(defaultSystem)),
        });
      } else {
        node.$self = observable({
          ...defaultProps,
        });
        node.$system = observable({
          ...defaultSystem,
        });
      }
      autorun(() => {
        const obj = {
          $self: serialize(toJS(node.$self)),
          $system: toJS(node.$system),
        };
        ls.setItem(`page_${path}`, JSON.stringify(obj));
      });
    };
  },

  routeTo: (path, searchs) => {
    return ({ state }) => {
      const {
        pathB,
        path,
        routesB,
        routes,
      } = store.system.router;

      const rem = new Set();
      let pathC;
      // Find the valid path of last path
      for (pathC = pathB; pathC && !state[pathC];) {
        pathC = pathC.slice(0, pathC.lastIndexOf('/'));
      }
      if (!pathC) pathC = '/';
      const validPathB = pathC;
      for (; pathC; pathC = temps.pages[pathC].parent) {
        rem.add(pathC);
      }

      // Find the valid path of current path
      for (pathC = path; pathC && !temps.pages[pathC];) {
        pathC = pathC.substr(0, pathC.lastIndexOf('/'));
      }
      if (!pathC) pathC = '/';
      if (pathC === validPathB) return;
      const validPathC = pathC;

      let wHasEmpty = false;
      if (rem.has(pathC)) {
        _.each(temps.pages[pathC].subpages._def && temps.pages[pathC].subpages._def.pages, (page) => {
          if (page.props.class === 'EmptyRoute') {
            wHasEmpty = true;
            return false;
          }
        });
      }
      for (pathC = validPathC; pathC !== '/'; pathC = temps.pages[pathC].parent) {
        let node;
        if (rem.has(pathC)) {
          if (!wHasEmpty) break;
          node = state[pathC];
        } else {
          node = state[temps.pages[pathC].parent];
          if (!node) break;
        }
        const group = node.$system.subpages._def;
        group.pageB = group.pageC;
        group.pageC = pathC;
        node.$system.subpages._def = _.cloneDeep(group);
        if (rem.has[pathC]) break;
      }
      for (pathC = validPathC; pathC !== '/'; pathC = temps.pages[pathC].parent) {
        let node;
        if (rem.has(pathC)) {
          if (!wHasEmpty) break;
          node = state[pathC];
        } else {
          node = state[temps.pages[pathC].parent];
          if (!node) break;
        }
        const { onSubpagesUpdate } = temps.pages[temps.pages[pathC].parent] || {};
        if (onSubpagesUpdate && onSubpagesUpdate._def) {
          const props = onSubpagesUpdate._def({
            path: pathC,
            route: pathC.substr(pathC.lastIndexOf('/') + 1),
            node: state[path],
          });
          _.each(props, (item, key) => {
            node.$self[key] = observable(item);
          });
        }
        if (rem.has[pathC]) break;
      }
    };
  },

  initSubpages: ({
    path, group, pageC, pages,
  }) => {
    return ({ state }) => {
      state[path].$system.subpages[group] = {
        pageC,
        pageB: '',
        route: pageC ? pageC.substr(pageC.lastIndexOf('/') + 1) : '',
      };
      temps.pages[path].subpages[group] = {
        pages,
      };
      const { onSubpagesUpdate } = temps.pages[path] || {};
      if (onSubpagesUpdate && onSubpagesUpdate._def) {
        const props = onSubpagesUpdate._def({
          path: pageC,
          route: pageC ? pageC.substr(pageC.lastIndexOf('/') + 1) : '',
          node: temps.pages[path].node,
        });
        _.each(props, (item, key) => {
          state[path].$self[key] = observable(item);
        });
      }
    };
  },
};
