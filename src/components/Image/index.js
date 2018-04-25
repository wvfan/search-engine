import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

export default class Image extends React.PureComponent {

  static defaultProps = {
    class: 'Image',
  };

  render() {
    return (
      <img {..._.omit(this.props, ['class'])} />
    );
  }
}
