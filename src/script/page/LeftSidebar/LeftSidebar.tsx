/*
 * Wire
 * Copyright (C) 2022 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import React, {useEffect} from 'react';

import {amplify} from 'amplify';
import cx from 'classnames';

import {WebAppEvents} from '@wireapp/webapp-events';

import {Conversations} from './panels/Conversations';
import {TemporaryGuestConversations} from './panels/TemporatyGuestConversations';

import {User} from '../../entity/User';
import {ListViewModel} from '../../view_model/ListViewModel';
import {useAppState, ListState} from '../useAppState';

type LeftSidebarProps = {
  listViewModel: ListViewModel;
  selfUser: User;
  isActivatedAccount: boolean;
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({listViewModel, selfUser, isActivatedAccount}) => {
  const {conversationRepository, propertiesRepository} = listViewModel;
  const repositories = listViewModel.contentViewModel.repositories;
  const listState = useAppState(state => state.listState);

  const switchList = (list: ListState) => listViewModel.switchList(list);

  useEffect(() => {
    amplify.subscribe(WebAppEvents.SHORTCUT.START, () => switchList(ListState.START_UI));
  }, []);

  return (
    <aside id="left-column" className={cx('left-column', {'left-column--light-theme': !isActivatedAccount})}>
      {[ListState.CONVERSATIONS, ListState.START_UI, ListState.PREFERENCES, ListState.ARCHIVE].includes(listState) && (
        <Conversations
          selfUser={selfUser}
          listViewModel={listViewModel}
          searchRepository={repositories.search}
          teamRepository={repositories.team}
          integrationRepository={repositories.integration}
          userRepository={repositories.user}
          propertiesRepository={propertiesRepository}
          conversationRepository={conversationRepository}
          preferenceNotificationRepository={repositories.preferenceNotification}
        />
      )}

      {listState === ListState.TEMPORARY_GUEST && (
        <TemporaryGuestConversations
          callingViewModel={listViewModel.callingViewModel}
          listViewModel={listViewModel}
          selfUser={selfUser}
        />
      )}
    </aside>
  );
};

export {LeftSidebar};
