import React from 'react';
import PropTypes from 'prop-types';

const lang = dict => (
  Component => (
    class LangProvider extends React.Component {

      static contextTypes = {
        dict: PropTypes.object,
      };

      static childContextTypes = {
        dict: PropTypes.object,
      };

      getChildContext() {
        if (!dict) return;
        return {
          dict: {
            ...this.context.dict,
            ...dict,
          },
        };
      }

      render() {
        return <Component {...this.props} />;
      }
    }
  )
);
export default lang;
