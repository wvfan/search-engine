import _ from 'lodash';

export const initialState = {
  lang: 'zhC',
  router: {
    path: '/',
    pathB: '/',
    routes: [],
    routesB: [],
  },
};

export const serialize = (obj) => {
  return _.omit(obj, ['router']);
};

export const deserialize = (obj) => {
  return {
    lang: obj.lang,
    router: {
      path: '/',
      pathB: '/',
      routes: [],
      routesB: [],
    },
  };
};

export const actions = {

  update: (params) => {
    return ({ state }) => {
      _.each(params, (item, key) => {
        state[key] = item;
      });
    };
  },

  routeTo: (path) => {
    return ({ state }) => {
      const routes = [];
      _.each(path.split('/'), (route) => {
        if (!route) return;
        routes.push(route);
      });
      const { router } = state;
      router.pathB = router.path;
      router.path = path;
      router.routesB = router.routes;
      router.routes = routes;
    };
  },

  setLang: (lang) => {
    return ({ state }) => {
      state.lang = lang;
    };
  },
};
