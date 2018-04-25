import React from 'react';
import { View, Text } from 'react-native-plus';
import PropTypes from 'prop-types';
import autoBind from 'auto-bind';
import _ from 'lodash';

import { styles } from './styles.scss';

import Option from './Option';

export { Option };

export default class Select extends React.Component {

  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]),
    field: PropTypes.string,
    optionC: PropTypes.string,
  };

  static defaultProps = {
    class: 'Button',
  };

  static contextTypes = {
    state: PropTypes.object,
    actions: PropTypes.object,
  };

  constructor(props, context) {
    super(props, context);
    this.ref = null;
    this.state = {
      wOpen: false,
    };
    autoBind(this);
  }

  componentWillMount() {
    document.addEventListener('click', this.outClickEvent);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.outClickEvent);
  }

  outClickEvent(evt) {
    if (!this.state.wOpen) return;
    let wFound = false;
    for (let node = evt.target; node !== document; node = node.parentNode) {
      if (node === this.ref) {
        wFound = true;
        break;
      }
    }
    if (!wFound) {
      this.setState({
        wOpen: false,
      });
    }
  }

  render() {
    const {
      className = '',
      children,
      field,
    } = this.props;
    const {
      wOpen,
    } = this.state;
    const optionC = this.context.state[field];

    let childC;
    React.Children.map(children, (child) => {
      if (child.props.name === optionC) {
        childC = child;
      }
    });

    return (
      <View
        ref={(ref) => {
          if (!ref) return;
          this.ref = ref.ref;
        }}
        className={`select ${className}`}
        styles={styles}
      >
        <View
          className="optionC"
          style={{
            width: this.optionsRef ? this.optionsRef.offsetWidth + 'px' : 'auto',
          }}
          onClick={() => {
            this.setState({
              wOpen: !wOpen,
            });
          }}
        >
          {childC}
        </View>
        <View
          ref={(ref) => {
            if (!ref) return;
            this.optionsRef = ref.ref;
          }}
          className={`options ${!wOpen ? 'options-hide' : ''}`}
        >
          {React.Children.map(children, (child) => {
            return (
              <View
                className="optionContainer"
                onClick={() => {
                  this.context.actions.update(field, child.props.name);
                  this.setState({
                    wOpen: false,
                  });
                }}
              >
                {child}
              </View>
            );
          })}
        </View>
      </View>
    );
  }
}
