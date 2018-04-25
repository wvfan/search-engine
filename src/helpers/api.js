import _ from 'lodash';

import store from 'store';
import { actions as userActions } from 'store/user';

async function run(func, params) {
  const user = {};
  if (func !== 'login') {
    user.userId = store.user.userId;
    user.session = store.user.session;
    user.token = store.user.token;
  }
  let res = await fetch('http://120.79.134.137/api/v0.1/run', {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    mode: 'cors',
    body: JSON.stringify({
      func,
      params,
      user,
    }),
  });
  res = await res.json();
  if (typeof res === 'string' && (res.startsWith('{') || res.startsWith('['))) res = JSON.parse(res);
  if (res.error) throw res.error;

  if (res.user) {
    userActions.update({
      session: res.user.session,
      token: res.user.token,
    });
  }

  return res.result;
}

export default run;
