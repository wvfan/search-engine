import React from 'react';
import { View } from 'react-native-plus';
import PropTypes from 'prop-types';
import autobind from 'auto-bind';
import _ from 'lodash';

import stylesVariables from 'styles/variables';

import { styles } from './styles.scss';

export default class Loading extends React.PureComponent {

  static propTypes = {
    class: PropTypes.string,
    className: PropTypes.string,
    size: PropTypes.number,
    width: PropTypes.number,
    color: PropTypes.string,
    style: PropTypes.object,
  };

  static defaultProps = {
    class: 'Loading',
  };

  render() {
    const {
      className,
      size = 25,
      width = 0.3,
      color = stylesVariables.primary,
      style = {},
    } = this.props;
    return (
      <View
        className={`loading ${className || ''} ${styles}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          ...style,
        }}
      >
        <View className="outlet">
          <svg
            className="circle"
            style={{
              color,
              transform: `scale(${size / 100})`,
            }}
          >
            <circle
              className="path"
              cx={50}
              cy={50}
              r={50 - width * 50 / 2}
              fill="none"
              stroke={color}
              strokeWidth={width * 50}
            />
          </svg>
        </View>
      </View>
    );
  }
}
