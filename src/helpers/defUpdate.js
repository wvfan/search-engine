import _ from 'lodash';

const iterationUpdate = (target, obj) => {
  _.each(obj, (item, key) => {
    if (typeof target[key] !== 'object') {
      target[key] = item;
    } else {
      if (typeof item === 'object') {
        iterationUpdate(target[key], item);
      } else {
        target[key] = item;
      }
    }
  });
};

export default (...args) => {
  return ({ state }) => {
    if (args.length >= 2 && typeof args[0] !== 'object') { // With path
      const [path, value, type = 'update'] = args;
      const routes = path.split('/');
      let node = state;
      let nodeP;
      _.each(routes, (route) => {
        if (!route) return;
        nodeP = node;
        node = node[route];
      });
      if (type === 'update') {
        if (typeof value === 'object') {
          _.each(value, (item, key) => {
            nodeP[routes[routes.length - 1]][key] = item;
          });
        } else {
          nodeP[routes[routes.length - 1]] = value;
        }
      } else if (type === 'cover') {
        nodeP[routes[routes.length - 1]] = value;
      } else {
        iterationUpdate(nodeP[routes[routes.length - 1]], value);
      }
    } else { // Update root
      const [obj, type = 'update'] = args;
      if (typeof obj !== 'object') {
        throw new Error('Can only update object to root');
      }
      if (type === 'update') {
        _.each(obj, (item, key) => {
          state[key] = item;
        });
      } else {
        iterationUpdate(state, obj);
      }
    }
  };
};
