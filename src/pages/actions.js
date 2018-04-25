import _ from 'lodash';

import es from 'elasticsearch';

const client = new es.Client({
  host: 'http://localhost:9200',
  log: 'trace',
});

export function search(params) {
  return async ({ state }) => {
    const {
      queryString,
    } = params;
    const res = await client.search({
      index: 'stackoverflow',
      body: {
        query: {
          match: {
            question: queryString,
          },
        },
      },
    });
    state.results = res.hits;
  };
}
