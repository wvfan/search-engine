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
      color = stylesVariables.primary,
      style = {},
    } = this.props;
    const width = 16;
    return (
      <View
        className={`loading ${className || ''} ${styles}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          ...style,
        }}
      >
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
            r={50 - width / 2}
            fill="none"
            stroke={color}
            strokeWidth={width}
          />
        </svg>
      </View>
    );
  }
}
