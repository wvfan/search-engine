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
import bgImage from './images/home.jpg';

@page({
  path: '/',
  actions,
  defaultProps: {
    queryString: '',
    wSearching: false,
    results: {},
    chats: [],
  },
  serialize: obj => ({
    ..._.omit(obj, ['chats', 'results']),
  }),
  deserialize: obj => ({
    ...obj,
    results: [],
    chats: [],
  }),
})
@observer
export default class Root extends React.Component {

  static propTypes = {
    history: PropTypes.object,
    queryString: PropTypes.string,
    wSearching: PropTypes.bool,
    results: PropTypes.array,
    chats: PropTypes.array,
    update: PropTypes.func,
    search: PropTypes.func,
    addDialog: PropTypes.func,
  };

  constructor(props, context) {
    super(props, context);
    this.resultIndex = 0;
    this.search = ::this.search;
  }

  async search() {
    const {
      queryString,
    } = this.props;

    this.props.addDialog({
      user: 'self',
      text: queryString,
    });
    setTimeout(() => {
      this.bodyRef.scrollTop = this.mainRef.offsetHeight;
    }, 50);
    if (['change', 'another'].indexOf(queryString) !== -1) {
      this.resultIndex += 1;
      if (this.resultIndex >= this.props.results.length) {
        this.props.addDialog({
          user: 'bot',
          text: 'Sorry no more answer',
        });
      } else {
        this.props.addDialog({
          user: 'bot',
          text: this.props.results[this.resultIndex]._source.answer,
        });
      }
      setTimeout(() => {
        this.bodyRef.scrollTop = this.mainRef.offsetHeight;
      }, 50);
      return;
    }
    await this.props.search({
      queryString,
    });
    this.resultIndex = 0;
    this.props.addDialog({
      user: 'bot',
      text: this.props.results[0] && this.props.results[0]._source.answer || 'Sorry I don\'t know.',
    });
    setTimeout(() => {
      this.bodyRef.scrollTop = this.mainRef.offsetHeight;
    }, 50);
  }

  render() {
    const {
      queryString,
      wSearching,
      results,
      chats,
    } = this.props;

    return (
      <Page
        styles={styles}
        style={{
          backgroundImage: `url('${bgImage}')`,
        }}
      >
        <div className="cover absolute-parent" />
        <Body
          ref={(ref) => {
            this.bodyRef = ref && ref.ref;
          }}
        >
          <div
            ref={(ref) => {
              this.mainRef = ref;
            }}
            className="main"
          >
            <div className="fill-space" />
            {_.map(chats, (chat, index) => (
              <div
                key={index}
                className="chat"
              >
                {chat.user === 'self' ?
                  <div className="fill-space" />
                  : ''
                }
                {chat.user === 'bot' ?
                  <div className="avatar">
                    <img src={logo} />
                  </div>
                  : ''
                }
                <div className={`text text-${chat.user}`}>
                  {chat.text}
                </div>
                {chat.user === 'bot' ?
                  <div className="fill-space" />
                  : ''
                }
              </div>
            ))}
          </div>
        </Body>
        <div className="footer">
          <div className="input">
            <input
              type="text"
              value={queryString}
              placeholder="Type your question here..."
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
              size={20}
              context="Ask"
              right="&#xe60a;"
              onClick={this.search}
            />
          </div>
        </div>
      </Page>
    );
  }
}
