import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import _ from 'lodash';

import page from 'decorators/page';

import Page, { Body, Subpages, EmptyRoute } from 'components/Page';
import Button from 'components/Button';
import Loading from 'components/Loading';

import * as actions from './actions';

import { styles } from './styles.scss';
import logo from './images/logo.svg';

@page({
  path: '/',
  actions,
  defaultProps: {
    queryString: '',
    wSearching: false,
    results: {},
  },
  deserialize: obj => ({
    ...obj,
    results: {},
  }),
})
@observer
export default class Root extends React.Component {

  static propTypes = {
    history: PropTypes.object,
    queryString: PropTypes.string,
    wSearching: PropTypes.bool,
    results: PropTypes.object,
    update: PropTypes.func,
    search: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);
    this.search = ::this.search;
  }

  async search() {
    const {
      queryString,
    } = this.props;
    this.props.update({
      wSearching: true,
    });
    const res = await this.props.search({
      queryString,
    });
    this.props.update({
      wSearching: false,
    });
  }

  render() {
    const {
      queryString,
      wSearching,
      results,
    } = this.props;

    return (
      <Page styles={styles}>
        <Body>
          <div className="image">
            <img src={logo} />
            <div className={`circle ${wSearching ? 'circle-hide' : ''}`} />
            <Loading
              className={wSearching ? '' : 'loading-hide'}
              size={80}
            />
          </div>
          <div className="input">
            <input
              type="text"
              value={queryString}
              placeholder="Type a search query here"
              onChange={(evt) => {
                this.props.update({
                  queryString: evt.target.value,
                });
              }}
              onKeyPress={(evt) => {
                if (evt.key === 'Enter') this.search();
              }}
            />
            <Button
              size={24}
              context="Search"
              right="&#xe60a;"
              onClick={this.search}
            />
          </div>
          <div className={`result ${results.total === undefined ? 'result-hide' : ''}`}>
            {results.total} result{results.total <= 1 ? ' is' : 's are'}  found
          </div>
        </Body>
      </Page>
    );
  }
}
