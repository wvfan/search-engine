import React from 'react';
import { View, Text, InputText, defValueGetter, defValueSetter } from 'react-native-plus';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import autobind from 'auto-bind';
import _ from 'lodash';

import Loading from 'components/Loading';

import { styles } from './styles.scss';

@observer
export default class InputTextForm extends React.Component {

  static propTypes = {
    class: PropTypes.string,
    onRef: PropTypes.func,
    state: PropTypes.object,
    actions: PropTypes.object,
    field: PropTypes.string,
    icon: PropTypes.string,
    placeholder: PropTypes.string,
    hint: PropTypes.string,
    autoComplete: PropTypes.string,
    maxLength: PropTypes.number,
    extraTemplate: PropTypes.object,
    valueGetter: PropTypes.func,
    valueSetter: PropTypes.func,
    checker: PropTypes.func,
    checkerAsyn: PropTypes.func,
    onFocus: PropTypes.func,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
  };

  static defaultProps = {
    class: 'InputText',
  };

  static contextTypes = {
    state: PropTypes.object,
    actions: PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      status: 'did-blured',
      checkStatus: 'none',
      error: '',
      extra: null,
      winkStatus: 'none',
    };
    this.animation = null;
    autobind(this);
  }

  componentWillMount() {
    if (this.props.onRef) this.props.onRef(this);
    this.check();
  }

  componentWillReceiveProps(props, context) {
    if (props.field !== this.props.field) {
      this.check(props, context);
    }
  }

  willFocus() {
    this.setState({
      status: 'will-focus',
    });
    this.animation = requestAnimationFrame(this.focus);
  }

  focus() {
    if (this.animation) {
      clearTimeout(this.animation);
      this.animation = null;
    }
    this.setState({
      status: 'focus',
    });
    this.animation = setTimeout(this.didFocused, 300);
  }

  didFocused() {
    this.setState({
      status: 'did-focused',
    });
  }

  willBlur() {
    this.setState({
      status: 'will-blur',
    });
    requestAnimationFrame(this.blur);
  }

  blur() {
    if (this.animation) {
      clearTimeout(this.animation);
      this.animation = null;
    }
    this.setState({
      status: 'blur',
    });
    this.animation = setTimeout(this.didBlured, 300);
  }

  didBlured() {
    this.setState({
      status: 'did-blured',
    });
  }

  update({ status, error }) {
    if (status !== undefined && ['none', 'checking', 'success', 'error'].indexOf(status) === -1) {
      throw new Error(`No such checkStatus '${status}'`);
    }
    let extra = null;
    if (error && error.indexOf('${') !== -1) {
      const start = error.indexOf('${');
      const end = error.indexOf('}', start);
      extra = this.props.extraTemplate[error.slice(start + 2, end)];
      error = error.substr(0, start) + error.substr(end + 1);
    }
    this.setState({
      checkStatus: status,
      error,
      extra,
      winkStatus: 'none',
    });
  }

  check(props = this.props, context = this.context) {
    const {
      state = context.state,
      field,
      valueGetter = defValueGetter,
    } = props;
    const value = valueGetter(state, field);
    let wCorrect = true;
    if (props.checker) {
      wCorrect = props.checker(value, this.update);
    }
    if (wCorrect && props.checkerAsyn) {
      props.checkerAsyn(value, this.update);
    }
  }

  checkSync() {
    const {
      state = this.context.state,
      field,
      valueGetter = defValueGetter,
    } = this.props;
    const value = valueGetter(state, field);
    if (this.props.checker) {
      let res;
      const wCorrect = this.props.checker(value, (result) => {
        res = result;
      });
      if (!wCorrect) {
        this.update(res);
        return false;
      } else {
        if (!this.props.checkerAsyn) {
          this.update(res);
        }
        return true;
      }
    }
    return true;
  }

  wink() {
    if (this.winkTimeout) {
      clearTimeout(this.winkTimeout);
    }
    this.setState({
      winkStatus: 'highlight',
    });
    this.winkTimeout = setTimeout(() => {
      this.setState({
        winkStatus: 'lowlight',
      });
      this.winkTimeout = null;
    }, 300);
  }

  render() {
    const {
      state = this.context.state,
      field,
      placeholder,
      hint,
      valueGetter = defValueGetter,
    } = this.props;
    const {
      status,
      checkStatus,
      error,
      extra,
      winkStatus,
    } = this.state;
    const value = valueGetter(state, field);

    return (
      <View className={`${styles} ${styles}-${status}`}>
        <View className={`placeholder ${value && status.indexOf('blur') !== -1 ? 'placeholder-hide' : ''} secondary-color`}>
          <Text>{placeholder}</Text>
        </View>
        <View className="icon secondary-color">{this.props.icon}</View>
        <InputText
          onRef={(ref) => {
            if (!ref) return;
            this.getValue = ref.getValue;
          }}
          className={`input input-${winkStatus}`}
          type={field.indexOf('password') === -1 ? 'text' : 'password'}
          autoComplete={this.props.autoComplete}
          maxLength={this.props.maxLength}
          field={field}
          onFocus={(evt) => {
            this.willFocus();
            this.lastValue = evt.target.value;
            this.lastCheckStatus = checkStatus;
            this.lastError = error;
            this.lastExtra = extra;
            this.setState({
              winkStatus: 'none',
            });
            if (this.props.onFocus) {
              this.props.onFocus(evt);
            }
          }}
          onChange={(evt) => {
            this.setState({
              checkStatus: 'none',
            });
            if (this.props.onChange) {
              this.props.onChange(evt);
            }
          }}
          onBlur={(evt) => {
            this.willBlur();
            if (this.lastValue !== evt.target.value) {
              this.check();
            } else {
              this.setState({
                checkStatus: this.lastCheckStatus,
                error: this.lastError,
                extra: this.lastExtra,
              });
            }
            if (this.props.onBlur) {
              this.props.onBlur(evt);
            }
          }}
        />
        <View className="status">
          <Loading className={checkStatus !== 'checking' ? 'hide' : ''} />
          <View className={`success ${checkStatus !== 'success' ? 'hide' : ''}`}>&#xe621;</View>
          <View className={`error ${checkStatus !== 'error' ? 'hide' : ''}`}>&#xe623;</View>
        </View>
        <View className={`error ${checkStatus !== 'error' ? 'error-hide' : ''}`}>
          <Text>{error}</Text>
          {extra ?
            <View
              className="extra"
              onClick={(evt) => {
                extra.onClick(evt);
              }}
            >
              <Text>{extra.text}</Text>
            </View>
            : ''
          }
        </View>
        <View className={`hint ${status.indexOf('focus') === -1 || value ? 'hint-hide' : ''}`}>
          <Text>{hint}</Text>
        </View>
        <View className="line" />
      </View>
    );
  }
}
