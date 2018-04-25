import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import autoBind from 'auto-bind';

export default class View extends React.PureComponent {

  static defaultProps = {
    class: 'View',
  };

  static propTypes = {
    class: PropTypes.string,
    className: PropTypes.string,
    styles: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
    style: PropTypes.object,
    onResize: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);
    this.wMounted = false;
    autoBind(this);
  }

  componentWillMount() {
    if (this.props.onResize) {
      window.addEventListener('resize', this.onResize);
    }
  }

  componentWillUnmount() {
    if (this.props.onResize) {
      window.removeEventListener('resize', this.onResize);
    }
  }

  onResize() {
    if (this.props.onResize) {
      this.props.onResize({
        width: this.ref.offsetWidth,
        height: this.ref.offsetHeight,
      });
    }
  }

  render() {
    let { className = '' } = this.props;
    const { styles } = this.props;
    if (typeof styles === 'string') {
      className += ` ${styles}`;
    }
    const style = _.cloneDeep(this.props.style);
    if (style && style.transition) {
      let str = '';
      _.each(style.transition, (value, name) => {
        const obj = {
          duration: value.duration || 0,
          function: 'linear',
        };
        if (typeof value === 'number') {
          obj.duration = value;
        }
        if (value.function) {
          if (value.function instanceof Array) {
            obj.function = `bezier(${value.function.join(',')})`;
          } else {
            obj.function = value.function;
          }
        }
        if (str) str += ', ';
        str += `${name} ${obj.duration}ms ${obj.function}`;
      });
      style.transition = str;
    }
    return (
      <div
        ref={(ref) => {
          this.ref = ref;
          if (!this.wMounted) {
            this.onResize();
            this.wMounted = true;
          }
        }}
        {..._.omit(this.props, ['class', 'className', 'styles', 'style', 'onResize'])}
        className={className}
        style={style}
      />
    );
  }
}
