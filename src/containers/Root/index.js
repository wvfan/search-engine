import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter } from 'react-router-dom';

export default class Root extends React.Component {
  render() {
    return (
      <BrowserRouter>
        {this.props.app}
      </BrowserRouter>
    );
  }
}
Root.propTypes = {
  app: PropTypes.object.isRequired,
};
