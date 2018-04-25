import store from 'store';
import { actions as userActions } from 'store/user';

const url = 'https://plutus-music.herokuapp.com/run';

export default async function run(func, params, wAnonymous = false) {
  const { userId, mac, token } = store.user;
  if (!userId) wAnonymous = true;
  const res = await (await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      user: wAnonymous ? null : {
        userId,
        mac,
        token,
      },
      func,
      params,
    }),
  })).json();
  if (res.status === 'success') {
    if (res.token) {
      userActions.update({
        mac: res.mac || undefined,
        token: res.token,
      });
    }
    return res.result;
  } else {
    throw res.error;
  }
}
