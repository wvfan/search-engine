import React from 'react';
import { View, Text } from 'react-native-plus';
import PropTypes from 'prop-types';
import _ from 'lodash';

import Loading from 'components/Loading';

import { styles, textStyles, tabStyles } from './styles.scss';

export default class Button extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]),
    type: PropTypes.string,
    disabled: PropTypes.bool,
    text: PropTypes.string,
    wChecking: PropTypes.bool,
    context: PropTypes.string,
    left: PropTypes.string,
    right: PropTypes.string,
    size: PropTypes.number,
    color: PropTypes.string,
    backgroundColor: PropTypes.string,
    disabledColor: PropTypes.string,
    style: PropTypes.object,
  };

  static defaultProps = {
    class: 'Button',
  };

  constructor(props, context) {
    super(props, context);
    if (props.type === 'tab') {
      this.state = {
        circleStatus: 'none',
        circleX: 0,
        circleY: 0,
        circleR: 0,
      };
    }
  }

  render() {
    const {
      className = '',
      children,
      type = 'button',
      disabled = false,
      text = '',
      context = '',
      left = '',
      right = '',
      size = 16,
      backgroundColor = '',
      disabledColor = '#DDDDDD',
      wChecking = false,
      style = {},
    } = this.props;
    let {
      color,
    } = this.props;

    if (type === 'text') {
      return (
        <button
          className={`button ${disabled ? 'button-disabled' : ''} ${className} ${textStyles}`}
          type={type}
          disabled={disabled}
          style={{
            color: disabled ? disabledColor : color,
            fontSize: size,
            backgroundColor: 'transparent',
            ...style,
          }}
          {..._.omit(this.props, ['class', 'className', 'children', 'type', 'text', 'size', 'color', 'backgroundColor', 'wChecking'])}
        >
          <Text>{text}</Text>
        </button>
      );
    } else if (type === 'tab') {
      return (
        <button
          ref={(ref) => {
            this.ref = ref;
          }}
          className={`button ${disabled ? 'button-disabled' : ''} ${className} ${tabStyles}`}
          type={type}
          disabled={disabled}
          style={{
            padding: `${size * 0.6 + 9.5}px ${size * 1.6}px`,
            color,
            backgroundColor: disabled ? disabledColor : backgroundColor,
            fontSize: size,
            ...style,
          }}
          {..._.omit(this.props, ['class', 'className', 'children', 'type', 'text', 'size', 'color', 'backgroundColor', 'wChecking'])}
          onMouseDown={(evt) => {
            const x = evt.clientX - this.ref.getBoundingClientRect().left;
            const y = evt.clientY - this.ref.getBoundingClientRect().top;
            const width = evt.target.offsetWidth;
            const height = evt.target.offsetHeight;
            this.setState({
              circleStatus: 'start',
              circleX: x,
              circleY: y,
              circleR: 0,
            });
            requestAnimationFrame(() => {
              this.setState({
                circleStatus: 'open',
                circleR: Math.max(
                  (x ** 2 + y ** 2) ** 0.5,
                  ((width - x) ** 2 + y ** 2) ** 0.5,
                  (x ** 2 + (height - y) ** 2) ** 0.5,
                  ((width - x) ** 2 + (height - y) ** 2) ** 0.5,
                ),
              });
            });
          }}
          onMouseUp={(evt) => {
            this.setState({
              circleStatus: 'disappear',
            });
          }}
        >
          <Text>{text}</Text>
          <View className="cover absolute-parent" />
          <View
            className={`circle circle-${this.state.circleStatus}`}
            style={{
              left: this.state.circleX - this.state.circleR,
              top: this.state.circleY - this.state.circleR,
              width: this.state.circleR * 2,
              height: this.state.circleR * 2,
            }}
          />
        </button>
      );
    } else {
      if (!color) color = 'white';
      return (
        <button
          className={`button ${disabled ? 'button-disabled' : ''} ${className} ${styles}`}
          type={type}
          disabled={disabled}
          style={{
            padding: `${size * 0.3 + 5}px ${size * 0.6}px`,
            borderRadius: size * 0.2,
            color,
            backgroundColor: disabled ? disabledColor : backgroundColor,
            fontSize: size,
            ...style,
          }}
          {..._.omit(this.props, ['class', 'className', 'children', 'type', 'context', 'left', 'right', 'size', 'color', 'backgroundColor', 'wChecking'])}
        >
          <View className={`cover ${disabled ? 'cover-hide' : ''} absolute-parent`} />
          {children}
          {children || !left ? '' :
          <View className="left">
            <View
              className={`icon ${wChecking ? 'hide' : 'icon'}`}
              style={{
                fontSize: size * 1.1,
              }}
            >{left}</View>
            <Loading
              className={!wChecking ? 'hide' : ''}
              color={color}
              size={size * 1.1}
              style={{
                top: `${size * 0.08}px`,
              }}
            />
          </View>
          }
          {children ? '' :
          <View
            className="context"
            style={{
              marginLeft: right && !left ? size * 0.2 : size * 0.6,
              marginRight: left && !right ? size * 0.2 : size * 0.6,
            }}
          >
            <View className="fill-space" />
            <View className={`context ${context.startsWith('&#') ? 'icon' : ''}`}>
              <Text>{context}</Text>
            </View>
            <View className="fill-space" />
          </View>
          }
          {children || !right ? '' :
          <View className="right">
            <View
              className={`icon ${wChecking ? 'hide' : 'icon'}`}
              style={{
                fontSize: size * 1.1,
              }}
            >{right}</View>
            <Loading
              className={!wChecking ? 'hide' : ''}
              color={color}
              size={size * 1.1}
              style={{
                top: `${size * 0.08}px`,
              }}
            />
          </View>
          }
        </button>
      );
    }
  }
}
