import React from 'react';
import { View, Text } from 'react-native-plus';
import PropTypes from 'prop-types';
import * as mobx from 'mobx';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import autobind from 'auto-bind';
import _ from 'lodash';

import lang from 'decorators/lang';
import defUpdate from 'helpers/defUpdate';

import store from 'store';
import temps from 'temps';
import { actions as pageActions } from 'store/pages';

import Loading from 'components/Loading';
import Button from 'components/Button';

const defTime = 200;

const transformPath = (path) => {
  path = path.toLowerCase().replace(/\\/g, '/');
  if (path.startsWith('pages')) path = path.substr(5);
  return path;
};

export default function page(opts) {
  return (Component) => {
    const path = transformPath(opts.path);

    const {
      animation = {},
    } = opts;
    animation.appear = animation.appear || {};
    animation.disappear = animation.disappear || {};

    if (typeof opts.onSubpagesUpdate === 'function') {
      opts.onSubpagesUpdate = {
        _def: opts.onSubpagesUpdate,
      };
    }

    if (!temps.pages[path]) {
      temps.pages[path] = {
        verify: opts.verigy || (() => {}),
        onRouteCheck: opts.onRouteCheck,
        onSubpagesUpdate: opts.onSubpagesUpdate,
        component: Component,
        parent: path === '/' ? '' : (opts.parent || '/'),
        subpages: {},
        $self: opts.defaultTemps || {},
      };
      pageActions.initPage({
        path,
        defaultProps: opts.defaultProps || {},
        serialize: opts.serialize,
        deserialize: opts.deserialize,
      });
    }

    const node = store.pages[path];
    const parentNode = path !== '/' ? store.pages[path.slice(0, path.lastIndexOf('/'))] : null;

    const actions = {};
    opts.actions = opts.actions || {};
    if (!opts.actions.update) {
      opts.actions.update = defUpdate;
    }
    _.each(opts.actions, (action, key) => {
      actions[key] = (...args) => {
        return new Promise((resolve, reject) => {
          const funcName = _.lowerCase(key).split(' ').join('_').toUpperCase();
          console.log(`action PAGE_${path}_${funcName} ${new Date().toJSON()}`);
          let ret;
          mobx.transaction(async () => {
            const realFunc = action(...args);
            try {
              resolve(await realFunc({
                state: node.$self,
                actions: temps.pages[path].actions,
                temps: temps.pages[path].$self,
              }));
            } catch (err) {
              reject(err);
            }
          });
        });
      };
    });
    temps.pages[path].actions = actions;

    const systemActions = {
      update: defUpdate,
    };
    _.each(systemActions, (action, key) => {
      systemActions[key] = (...args) => {
        const funcName = _.lowerCase(key).split(' ').join('_').toUpperCase();
        let ret;
        mobx.transaction(() => {
          const realFunc = action(...args);
          ret = realFunc({
            state: node.$system,
          });
        });
        return ret;
      };
    });

    if (opts.onSystemUpdate) {
      mobx.autorun(() => {
        const ret = opts.onSystemUpdate(node.$system);
        defUpdate(ret)({
          state: node.$self,
          actions: temps.pages[path].actions,
          temps: temps.pages[path].$self,
        });
      });
    }

    const getAnimationRelatedParams = () => {
      let params;
      _.each(parentNode.$system.subpages, (group) => {
        const { pages, pageC, pageB } = group;
        const indexC = pages.indexOf(pageC);
        const indexB = pages.indexOf(pageB);
        if (indexC === -1 || indexB === -1) return;
        params = {
          delta: indexC - indexB,
          deltaCycle: Math.min(indexC - indexB, indexC + pages.length - indexB, indexC - pages.legnth - indexB),
        };
      });
      return params;
    };

    const proceedStyle = (params) => {
      if (typeof params.direction === 'function') {
        params.direction = params.direction(getAnimationRelatedParams());
      }
      if (params.transition === undefined) {
        const basic = {
          duration: params.time || defTime,
          function: 'ease-out',
        };
        params.transition = {
          left: _.cloneDeep(basic),
          right: _.cloneDeep(basic),
          top: _.cloneDeep(basic),
          bottom: _.cloneDeep(basic),
          opacity: defTime || params.time,
        };
      }
      if (params.direction === 'left') params.left = '-100%';
      if (params.direction === 'right') params.left = '100%';
      if (params.direction === 'left-lesser') params.left = '-25%';
      if (params.direction === 'right-lesser') params.left = '25%';
      if (params.direction === 'top') params.top = '-100%';
      if (params.direction === 'bottom') params.top = '100%';
      if (typeof params.opacity === 'function') params.opacity = params.opacity();
      if (!params.left) params.left = 0;
      if (!params.top) params.top = 0;
      if (!params.right) params.right = `calc(0px - ${params.left})`;
      if (!params.bottom) params.bottom = `calc(0px - ${params.top})`;
      delete params.direction;
    };

    const funcs = {
      pageWillAppear: () => {},
      pageAppear: () => {},
      pageDidAppeared: () => {},
      pageWillDisappear: () => {},
      pageDisappear: () => {},
    };

    const frame = {};

    @lang(opts.dict)
    @withRouter
    @observer
    class Router extends React.Component {

      static propTypes = {
        wShow: PropTypes.bool,
      }

      constructor() {
        super();
        this.process = null;
        this.state = {
          status: 'disappeared',
          style: {},
          listenData: {},
          catchData: {},
          wLoading: false,
          dialogStatus: 'hide',
        };
        this.dialog = {};
        autobind(this);
        frame.startLoading = this.startLoading;
        frame.endLoading = this.endLoading;
        frame.dialog = this.raiseDialog;
      }

      componentWillMount() {
        const { wShow } = this.props;
        setTimeout(() => {
          if (wShow) {
            this.didAppeared();
          } else {
            this.didDisappeared();
          }
        });
        /*
        let listenSchema = opts.listen || actions.listen;
        if (typeof listenSchema === 'function') {
          listenSchema = listenSchema();
        }
        if (listenSchema) {
          this.listener = dataActions.listen(listenSchema, (data) => {
            this.setState({ listenData: data });
          });
        }
        let catchSchema = opts.catch || actions.catch;
        if (typeof catchSchema === 'function') {
          catchSchema = catchSchema();
        }
        if (catchSchema) {
          this.catcher = dataActions.catch(catchSchema, (data) => {
            this.setState({ catchData: data });
          });
        } */
      }

      componentWillReceiveProps(props) {
        const wShowB = this.props.wShow;
        const { wShow } = props;
        const { status } = this.state;
        if (wShowB === wShow) return;
        setTimeout(() => {
          if (status === 'disappeared') {
            this.willAppear();
            setTimeout(() => {
              const time = !Object.keys(animation.appear).length ? 0 : this.appear() || animation.appear.time || defTime;
              this.process = setTimeout(this.didAppeared, time);
            }, 20);
          } else if (status === 'appeared') {
            this.willDisappear();
            setTimeout(() => {
              const time = !Object.keys(animation.disappear).length ? 0 : this.disappear() || animation.disappear.time || defTime;
              this.process = setTimeout(this.didDisappeared, time);
            }, 20);
          } else if (status === 'disappearing') {
            clearTimeout(this.process);
            const time = !Object.keys(animation.appear).length ? 0 : this.appear() || animation.appear.time || defTime;
            this.process = setTimeout(this.didAppeared, time);
          } else if (status === 'appearing') {
            clearTimeout(this.process);
            const time = !Object.keys(animation.disappear).length ? 0 : this.disappear() || animation.disappear.time || defTime;
            this.process = setTimeout(this.didDisappeared, time);
          }
        });
      }

      componentWillUnmount() {
        this.setState({
          status: 'disappeared',
        });
        if (this.listener) {
          this.listener.off();
          delete this.listener;
        }
        if (this.catcher) {
          this.catcher();
          delete this.catcher;
        }
      }

      willAppear() {
        const params = _.cloneDeep(animation.appear);
        proceedStyle(params);
        if (typeof params.zIndex === 'undefined') params.zIndex = 1;
        delete params.transition;
        this.setState({
          status: 'appearing',
          style: params,
        });
        funcs.pageWillAppear();
      }

      appear() {
        const params = _.cloneDeep(animation.appear);
        proceedStyle(params);
        if (typeof params.zIndex === 'undefined') params.zIndex = 1;
        this.setState({
          status: 'appearing',
          style: {
            zIndex: params.zIndex,
            transition: params.transition,
          },
        });
        return funcs.pageAppear();
      }

      didAppeared() {
        this.setState({
          status: 'appeared',
          style: {},
        });
        funcs.pageDidAppeared();
      }

      willDisappear() {
        const params = _.cloneDeep(animation.disappear);
        this.setState({
          status: 'disappearing',
          style: {
            transition: params.transition,
          },
        });
        funcs.pageWillDisappear();
      }

      disappear() {
        const params = _.cloneDeep(animation.disappear);
        proceedStyle(params);
        if (typeof params.zIndex === 'undefined') params.zIndex = 0;
        this.setState({
          status: 'disappearing',
          style: params,
        });
        return funcs.pageDisappear();
      }

      didDisappeared() {
        this.setState({
          status: 'disappeared',
        });
      }

      startLoading() {
        this.setState({
          wLoading: true,
        });
      }

      endLoading() {
        this.setState({
          wLoading: false,
        });
      }

      raiseDialog(opts) {
        this.dialog = opts;
        this.setState({
          dialogStatus: 'show',
        });
        return new Promise((resolve, reject) => {
          _.each(this.dialog.buttons, (button) => {
            const onClick = button.onClick;
            button.onClick = (evt) => {
              if (onClick) onClick();
              resolve(button.result);
            };
          });
        })
        .then((result) => {
          this.setState({
            dialogStatus: 'hide',
          });
          return result;
        });
      }

      render() {
        const {
          wShow,
        } = this.props;
        const {
          status,
          style,
          wLoading,
          dialogStatus,
        } = this.state;
        if (path !== '/' && status === 'disappeared') return null;
        return (
          <View
            className={`page-animation ${path}`}
            style={style}
          >
            <Component
              ref={(ref) => {
                if (!ref) return;
                temps.pages[path].ref = ref;
                temps.pages[path].$self.ref = ref;
                funcs.pageWillAppear = ref.pageWillAppear || (() => {});
                funcs.pageAppear = ref.pageAppear || (() => {});
                funcs.pageDidAppeared = ref.pageDidAppeared || (() => {});
                funcs.pageWillDisappear = ref.pageWillDisappear || (() => {});
                funcs.pageDisappear = ref.pageDisappear || (() => {});
              }}
              __path={path}
              {..._.omit(this.props, ['location', 'match'])}
              {...mobx.toJS(node.$self)}
              {...this.state.listenData}
              {...this.state.catchData}
              {...actions}
              wLoading={wLoading}
            />
            <View className={`loading ${!wLoading ? 'loading-hide' : ''}`}>
              <Loading
                size={30}
              />
            </View>
            <View className={`dialog dialog-${dialogStatus} absolute-parent`}>
              <View
                className="body"
                style={this.dialog.style || {}}
              >
                {this.dialog.content || ''}
                <View className="buttons">
                  {_.map(this.dialog.buttons, (button, index) => {
                    if (button.type === 'space') {
                      return (
                        <View
                          key={index}
                          style={{
                            display: 'flex',
                            flex: button.flex,
                          }}
                        />
                      );
                    } else {
                      return (
                        <Button
                          key={index}
                          type={button.type}
                          className={`button ${button.className || ''} ${index === this.dialog.buttons.length - 1 ? 'button-right' : ''}`}
                          {..._.omit(button, ['type', 'className', 'result'])}
                        />
                      );
                    }
                  })}
                </View>
              </View>
            </View>
          </View>
        );
      }
    }

    class Contexter extends React.PureComponent {

      static defaultProps = {
        pagePath: path,
      };

      static childContextTypes = {
        state: PropTypes.object,
        actions: PropTypes.object,
        systemActions: PropTypes.object,
        pagePath: PropTypes.string,
        frame: PropTypes.object,
        temps: PropTypes.object,
      };

      getChildContext() {
        return {
          state: node.$self,
          actions,
          systemActions,
          pagePath: path,
          frame,
          temps: temps.pages[path].$self,
        };
      }

      render() {
        return (
          <Router
            {...this.props}
          />
        );
      }
    }

    return Contexter;
  };
}
