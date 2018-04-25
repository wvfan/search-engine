import React from 'react';
import PropTypes from 'prop-types';

export default function withClass(className) {
  return (Class) => {
    class withClass extends React.PureComponent {

      static defaultProps = {
        class: className,
      }

      static propTypes = {
        class: PropTypes.string,
      }

      render() {
        return (
          <Class
            class={className}
            {...this.props}
          />
        );
      }
    }
    return withClass;
  };
}
