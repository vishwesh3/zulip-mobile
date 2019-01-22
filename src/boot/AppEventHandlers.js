/* @flow */
import { connect } from 'react-redux';

import React, { PureComponent } from 'react';
import { AppState, NetInfo, View, StyleSheet, Platform, NativeModules } from 'react-native';
import SafeArea from 'react-native-safe-area';
import Orientation from 'react-native-orientation';

import type {
  ChildrenArray,
  Dispatch,
  GlobalState,
  Orientation as OrientationT,
  UserIdMap,
} from '../types';
import { getUnreadByHuddlesMentionsAndPMs, getUsersById } from '../selectors';
import { handleInitialNotification, NotificationListener } from '../notification';
import {
  appOnline,
  appOrientation,
  appState,
  initSafeAreaInsets,
  reportPresence,
  updateShareData,
} from '../actions';

const componentStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
});

type Props = {|
  dispatch: Dispatch,
  children: ChildrenArray<*>,
  unreadCount: number,
  usersById: UserIdMap,
|};

class AppEventHandlers extends PureComponent<Props> {
  handleOrientationChange = (orientation: OrientationT) => {
    const { dispatch } = this.props;
    dispatch(appOrientation(orientation));
  };

  handleConnectivityChange = connectionInfo => {
    const { dispatch } = this.props;
    const isConnected = connectionInfo.type !== 'none' && connectionInfo.type !== 'unknown';
    dispatch(appOnline(isConnected));
  };

  handleAppStateChange = state => {
    const { dispatch, unreadCount } = this.props;
    dispatch(reportPresence(state === 'active'));
    dispatch(appState(state === 'active'));
    if (state === 'background' && Platform.OS === 'android') {
      NativeModules.BadgeCountUpdaterModule.setBadgeCount(unreadCount);
    }
  };

  notificationListener = new NotificationListener(this.props.dispatch, this.props.usersById);

  handleMemoryWarning = () => {
    // Release memory here
  };

  componentDidMount() {
    const { dispatch, usersById } = this.props;
    handleInitialNotification(dispatch, usersById);

    NetInfo.addEventListener('connectionChange', this.handleConnectivityChange);
    AppState.addEventListener('change', this.handleAppStateChange);
    AppState.addEventListener('memoryWarning', this.handleMemoryWarning);
    SafeArea.getSafeAreaInsetsForRootView().then(params =>
      dispatch(initSafeAreaInsets(params.safeAreaInsets)),
    );
    // $FlowFixMe: libdef wrongly says callback's parameter is optional
    Orientation.addOrientationListener(this.handleOrientationChange);
    this.notificationListener.start();

    if (Platform.OS === 'android') {
      // currently we don't handle sharing from other app, see #3277
      NativeModules.RNGetShareData.getShareData((type, data) => {
        if (type === 'text') {
          // currently only handelling text
          dispatch(updateShareData({ type, data }));
        }
      });
    }
  }

  componentWillUnmount() {
    NetInfo.removeEventListener('connectionChange', this.handleConnectivityChange);
    AppState.removeEventListener('change', this.handleAppStateChange);
    AppState.removeEventListener('memoryWarning', this.handleMemoryWarning);
    // $FlowFixMe: libdef wrongly says callback's parameter is optional
    Orientation.removeOrientationListener(this.handleOrientationChange);
    this.notificationListener.stop();
  }

  render() {
    return <View style={componentStyles.wrapper}>{this.props.children}</View>;
  }
}

export default connect((state: GlobalState) => ({
  usersById: getUsersById(state),
  unreadCount: getUnreadByHuddlesMentionsAndPMs(state),
}))(AppEventHandlers);
