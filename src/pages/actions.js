import _ from 'lodash';

import es from 'elasticsearch';

export function search(params) {
  return async ({ state }) => {
    const {
      queryString,
    } = params;
    let res = await fetch(`http://localhost:8080/QA_bot/query/${queryString}`);
    res = await res.json();
    console.log(res);
    state.results = res.hits;
  };
}

export function addDialog(params) {
  return ({ state }) => {
    const {
      user,
      text,
    } = params;
    state.chats.push({
      user,
      text,
    });
    state.queryString = '';
  };
}
