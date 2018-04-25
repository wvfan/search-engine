import _ from 'lodash';

function iterateUpdate(target, obj) {
  _.each(obj, (item, key) => {
    if (typeof target[key] === 'object' && typeof item === 'object') {
      iterateUpdate(target[key], item);
    } else {
      target[key] = obj;
    }
  });
}

export default function combineStyles(...styles) {
  if (typeof styles[0] === 'string') {
    return styles.join(' ');
  }
  const ret = {};
  _.each(styles, (style) => {
    iterateUpdate(ret, style);
  });
  return ret;
}
