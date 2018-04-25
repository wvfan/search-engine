import _ from 'lodash';

export const defValueGetter = (state, field) => {
  return state[field];
};

export const defValueSetter = (value, actions, field) => {
  actions.update(field, value);
};
