/* @flow */
import deepFreeze from 'deep-freeze';

import { PRESENCE_RESPONSE, EVENT_PRESENCE, ACCOUNT_SWITCH } from '../../actionConstants';
import presenceReducers, { updateUserWithPresence } from '../presenceReducers';

const fiveSecsAgo = Math.floor(new Date() - 5) / 1000;
const serverTimestamp = new Date() / 1000;

describe('presenceReducers', () => {
  test('handles unknown action and no state by returning initial state', () => {
    const newState = presenceReducers(undefined, {});
    expect(newState).toBeDefined();
  });

  test('on unrecognized action, returns input state unchanged', () => {
    const prevState = deepFreeze({ hello: 'world' });

    const newState = presenceReducers(prevState, {});
    expect(newState).toBe(prevState);
  });

  describe('updateUserWithPresence', () => {
    test('if there is aggregated object present, use that', () => {
      const presence = {
        website: {
          client: 'website',
          status: 'active',
          timestamp: 1474527507,
        },
        aggregated: {
          client: 'website',
          status: 'active',
          timestamp: fiveSecsAgo,
        },
        ZulipMobile: {
          client: 'ZulipMobile',
          status: 'idle',
          timestamp: fiveSecsAgo,
        },
      };

      const expectedResult = {
        client: 'website',
        status: 'active',
        timestamp: fiveSecsAgo,
        email: 'joe@a.com',
        age: serverTimestamp - fiveSecsAgo,
      };

      const actualResult = updateUserWithPresence(
        { email: 'joe@a.com' },
        presence,
        serverTimestamp,
      );

      expect(actualResult).toEqual(expectedResult);
    });
    test('if there is no aggregated object present, get presence from latest device', () => {
      const presence = {
        website: {
          client: 'website',
          status: 'offline',
          timestamp: 1474527507,
        },
        ZulipMobile: {
          client: 'ZulipMobile',
          status: 'active',
          timestamp: fiveSecsAgo,
        },
      };

      const expectedResult = {
        client: 'ZulipMobile',
        status: 'active',
        timestamp: fiveSecsAgo,
        email: 'joe@a.com',
        age: serverTimestamp - fiveSecsAgo,
      };

      const actualResult = updateUserWithPresence(
        { email: 'joe@a.com' },
        presence,
        serverTimestamp,
      );

      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe('PRESENCE_RESPONSE', () => {
    test('merges a single user in presence response', () => {
      const presence = {
        'email@example.com': {
          website: {
            client: 'website',
            status: 'active',
            timestamp: fiveSecsAgo,
          },
        },
      };
      const action = deepFreeze({
        type: PRESENCE_RESPONSE,
        presence,
        serverTimestamp,
      });

      const prevState = deepFreeze([
        {
          email: 'email@example.com',
          status: 'offline',
        },
      ]);

      const expectedState = [
        {
          email: 'email@example.com',
          status: 'active',
          timestamp: fiveSecsAgo,
          age: serverTimestamp - fiveSecsAgo,
          client: 'website',
        },
      ];

      const newState = presenceReducers(prevState, action);

      expect(newState).toEqual(expectedState);
    });

    test('merges multiple users in presence response', () => {
      const presence = {
        'email@example.com': {
          website: {
            status: 'active',
            timestamp: 1474527507,
            client: 'website',
            pushable: false,
          },
        },
        'johndoe@example.com': {
          website: {
            status: 'active',
            timestamp: fiveSecsAgo,
            client: 'website',
            pushable: false,
          },
          ZulipReactNative: {
            status: 'active',
            timestamp: 1475792205,
            client: 'ZulipReactNative',
            pushable: false,
          },
          ZulipAndroid: {
            status: 'active',
            timestamp: 1475455046,
            client: 'ZulipAndroid',
            pushable: false,
          },
        },
        'janedoe@example.com': {
          website: {
            status: 'idle',
            timestamp: 1475792202,
            client: 'website',
            pushable: false,
          },
          ZulipAndroid: {
            status: 'active',
            timestamp: 1475792203,
            client: 'ZulipAndroid',
            pushable: false,
          },
        },
      };
      const action = deepFreeze({
        type: PRESENCE_RESPONSE,
        presence,
        serverTimestamp,
      });

      const prevState = deepFreeze([
        {
          email: 'email@example.com',
          status: 'offline',
        },
        {
          email: 'johndoe@example.com',
          status: 'offline',
        },
        {
          email: 'janedoe@example.com',
          status: 'offline',
        },
      ]);

      const expectedState = [
        {
          email: 'email@example.com',
          status: 'active',
          timestamp: 1474527507,
          age: serverTimestamp - 1474527507,
          client: 'website',
          pushable: false,
        },
        {
          email: 'johndoe@example.com',
          status: 'active',
          timestamp: fiveSecsAgo,
          age: serverTimestamp - fiveSecsAgo,
          client: 'website',
          pushable: false,
        },
        {
          email: 'janedoe@example.com',
          status: 'active',
          timestamp: 1475792203,
          age: serverTimestamp - 1475792203,
          client: 'ZulipAndroid',
          pushable: false,
        },
      ];

      const newState = presenceReducers(prevState, action);

      expect(newState).toEqual(expectedState);
    });
  });

  describe('EVENT_PRESENCE', () => {
    test('merges a single user presence', () => {
      const prevState = deepFreeze([
        {
          email: 'email@example.com',
          status: 'offline',
          timestamp: 200,
          age: 100,
        },
      ]);

      const action = deepFreeze({
        type: EVENT_PRESENCE,
        email: 'email@example.com',
        server_timestamp: serverTimestamp,
        presence: {
          website: {
            status: 'active',
            timestamp: fiveSecsAgo,
          },
        },
      });

      const expectedState = [
        {
          email: 'email@example.com',
          status: 'active',
          timestamp: fiveSecsAgo,
          age: serverTimestamp - fiveSecsAgo,
        },
      ];

      const newState = presenceReducers(prevState, action);

      expect(newState).toEqual(expectedState);
    });
  });

  describe('ACCOUNT_SWITCH', () => {
    test('resets state to initial state', () => {
      const initialState = deepFreeze([
        {
          full_name: 'Some Guy',
          email: 'email@example.com',
          status: 'offline',
        },
      ]);

      const action = deepFreeze({
        type: ACCOUNT_SWITCH,
      });

      const expectedState = [];

      const actualState = presenceReducers(initialState, action);

      expect(actualState).toEqual(expectedState);
    });
  });
});
