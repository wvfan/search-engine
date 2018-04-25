import _ from 'lodash';

import store from 'store';
import { actions as userActions } from 'store/user';

async function run(params) {
  let res = await fetch('http://localhost:9200', {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    mode: 'cors',
    body: typeof params === 'string' ? params : JSON.stringify(params),
  });
  res = await res.json();
  if (typeof res === 'string' && (res.startsWith('{') || res.startsWith('['))) res = JSON.parse(res);
  if (res.error) throw res.error;

  return res.result;
}

export default run;
