import React from 'react';
import { View, Text } from 'react-native-plus';
import PropTypes from 'prop-types';
import autobind from 'auto-bind';
import _ from 'lodash';

export default class Option extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]),
    name: PropTypes.string,
    content: PropTypes.string,
  };

  static defaultProps = {
    class: 'Button',
  };

  render() {
    const {
      className = '',
      children,
      name,
      content,
    } = this.props;

    return (
      <View className={`option ${className}`}>
        {children ||
          <Text className="option-content">{content}</Text>
        }
      </View>
    );
  }
}
