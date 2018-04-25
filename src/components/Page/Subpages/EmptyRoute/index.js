import React from 'react';
import PropTypes from 'prop-types';
import withClass from 'decorators/withClass';

@withClass('EmptyRoute')
export default class EmptyRoute extends React.Component {

  static propTypes = {
    pagePath: PropTypes.string,
  };

  render() {
    return null;
  }
}
