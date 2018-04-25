import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import Root from 'containers/Root';
import App from 'containers/App';

ReactDOM.render(
  <Root app={<App />} />,
  document.getElementById('root'),
);

if (module.hot) {
  module.hot.accept();
}
