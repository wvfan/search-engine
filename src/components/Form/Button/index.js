import React from 'react';
import { View, Text } from 'react-native-plus';
import PropTypes from 'prop-types';
import _ from 'lodash';

import Loading from 'components/Loading';

import { styles } from './styles.scss';

export default class Button extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]),
    type: PropTypes.string,
    disabled: PropTypes.bool,
    wChecking: PropTypes.bool,
    context: PropTypes.string,
    left: PropTypes.string,
    right: PropTypes.string,
    size: PropTypes.number,
    color: PropTypes.string,
    backgroundColor: PropTypes.string,
  };

  static defaultProps = {
    class: 'Button',
  };

  static contextTypes = {
    state: PropTypes.object,
    form: PropTypes.object,
  };

  componentWillMount() {
    const { form } = this.context;
    if (form) {
      form.addButton(this);
    }
  }

  componentWillUnmount() {
    const { form } = this.context;
    if (form) {
      form.removeButton(this);
    }
  }

  render() {
    const {
      className = '',
      children,
      type = 'button',
      disabled = false,
      context = '',
      left = '',
      right = '',
      size = 20,
      color = 'white',
      backgroundColor = '',
    } = this.props;
    const {
      form = {},
    } = this.context;
    const { wChecking = false } = form;

    return (
      <button
        className={`button ${className} ${styles}`}
        type={type}
        disabled={disabled}
        style={{
          padding: `${size * 0.4}px ${size * 0.6}px`,
          borderRadius: size * 0.2,
          color,
          backgroundColor,
          fontSize: size,
        }}
        {..._.omit(this.props, ['class', 'className', 'children', 'type', 'context', 'left', 'right', 'size', 'color', 'backgroundColor'])}
      >
        <View className="cover absolute-parent" />
        {children}
        {children ? '' :
        <View className="icon">{left}</View>
        }
        {children ? '' :
        <View
          className="context"
          style={{
            marginLeft: right && !left ? size * 0.5 : size * 0.2,
            marginRight: left && !right ? size * 0.5 : size * 0.2,
          }}
        >
          <View className="fill-space" />
          <View className={`context ${context.startsWith('&#') ? 'icon' : ''}`}>
            <Text>{context}</Text>
          </View>
          <View className="fill-space" />
        </View>
        }
        {children ? '' :
        <View className="right">
          <View className={`icon ${wChecking ? 'hide' : 'icon'}`}>{right}</View>
          <Loading
            className={!wChecking ? 'hide' : ''}
            color={color}
            size={size * 1.1}
          />
        </View>
        }
      </button>
    );
  }
}
