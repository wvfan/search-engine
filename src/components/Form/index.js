import React from 'react';
import PropTypes from 'prop-types';
import autoBind from 'auto-bind';
import _ from 'lodash';

import InputText from './InputText';
import Button from './Button';

export { InputText, Button };

export default class Form extends React.PureComponent {

  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.array,
    ]),
    onSubmit: PropTypes.func,
  };

  static defaultProps = {
    class: 'Form',
  };

  static childContextTypes = {
    form: PropTypes.object,
  };

  constructor(props) {
    super(props);
    autoBind(this);
    this.inputs = {};
    this.buttons = new Set();
    this.wChecking = false;
    this.dealChildren(props);
  }

  getChildContext() {
    return {
      form: this,
    };
  }

  componentWillMount() {
    this.checkError();
  }

  componentWillReceiveProps(props) {
    if (props.children.length === this.props.children.length) return;
    this.dealChildren(props);
  }

  shouldComponentUpdate(props, state) {
    if (props.children.length === this.props.children.length) return false;
    return true;
  }

  checkError() {
    this.wError = false;
    _.each(this.inputs, (item) => {
      const value = item.getValue();
      if (!item.props.wNotRequired && !value
        || item.state.checkStatus === 'error'
        || item.state.checkStatus === 'checking') {
        this.wError = true;
        return false;
      }
    });
  }

  updateCheckingState(wChecking) {
    this.wChecking = wChecking;
    this.buttons.forEach((button) => {
      button.forceUpdate();
    });
  }

  addButton(button) {
    this.buttons.add(button);
  }

  removeButton(button) {
    this.buttons.delete(button);
  }

  dealChildren(props = this.props) {
    let { children } = props;
    if (!(children instanceof Array)) children = [children];
    if (children.length <= 0) children = null;

    let unnamed = 0;
    this.children = React.Children.map(children, (child) => {
      if (!child) return null;
      if (child.props.class.startsWith('Input')) {
        const { field, checkWith } = child.props;
        return React.cloneElement(child, {
          onRef: (ref) => {
            this.inputs[field || `unnamed_${unnamed += 1}`] = ref;
          },
          onBlur: !checkWith ? undefined :
            (evt) => {
              this.inputs[checkWith].check();
              if (child.props.onBlur) child.props.onBlur(evt);
            },
        });
      }
      return child;
    });
  }

  render() {
    return (
      <form
        className="form"
        {..._.omit(this.props, ['class', 'children'])}
        onSubmit={async (evt) => {
          evt.preventDefault();

          this.wError = false;
          _.each(this.inputs, (item) => {
            const value = item.getValue();
            if (item.state.checkStatus === 'error'
              || item.state.checkStatus === 'checking'
              || !item.checkSync()) {
              this.wError = true;
              item.wink();
            }
          });

          if (!this.wError) {
            const values = {};
            _.each(this.inputs, (item) => {
              values[item.props.field] = item.getValue();
            });
            if (this.props.onSubmit) {
              try {
                this.updateCheckingState(true);
                await this.props.onSubmit(values);
              } catch (err) {
                console.log(err);
                _.each(err, (error, key) => {
                  const item = this.inputs[key];
                  item.update({
                    status: 'error',
                    error,
                  });
                  item.lastValue = item.getValue();
                  item.lastCheckStatus = item.state.checkStatus;
                  item.lastError = item.state.error;
                  item.lastExtra = item.state.extra;
                });
              }
              this.updateCheckingState(false);
            }
          }
        }}
      >
        {this.children}
      </form>
    );
  }
}
