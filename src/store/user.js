import { autorun, observable, toJS } from 'mobx';
import ls from 'localStorage';
import _ from 'lodash';

import run from 'helpers/api';

export const initialState = {
  userId: '',
  session: '',
  token: '',
  username: '',
  wDetecting: false,
  lastDetect: '',
};

export const actions = {

  signup: (params) => {
    return async ({ state }) => {
      const user = await run('signup', params);
      actions.update(user);
    };
  },

  login: (params) => {
    return async ({ state }) => {
      const user = await run('login', params);
      actions.update(user);
    };
  },

  logout: (params) => {
    return async ({ state }) => {
      await run('logout');
      const ret = {};
      _.each(state, (item, key) => {
        if (typeof item === 'string') {
          ret[key] = '';
        } else if (typeof item === 'boolean') {
          ret[key] = false;
        }
      });
      actions.update(ret);
    };
  },

  fetch: (params) => {
    return async ({ state }) => {
      const user = await run('fetchUser');
      actions.update(user);
    };
  },
};
