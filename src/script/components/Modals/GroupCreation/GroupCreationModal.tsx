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

import React, {useEffect, useState, useMemo} from 'react';
import {container} from 'tsyringe';
import cx from 'classnames';
import {amplify} from 'amplify';
import {WebAppEvents} from '@wireapp/webapp-events';
import {Button, ButtonVariant, Select, StyledApp, THEME_ID} from '@wireapp/react-ui-kit';
import {RECEIPT_MODE} from '@wireapp/api-client/src/conversation/data/ConversationReceiptModeUpdateData';
import {ConversationProtocol} from '@wireapp/api-client/src/conversation/NewConversation';

import {getLogger} from 'Util/Logger';
import {sortUsersByPriority} from 'Util/StringUtil';
import {ConversationRepository} from '../../../conversation/ConversationRepository';

import {SearchRepository} from '../../../search/SearchRepository';
import {TeamRepository} from '../../../team/TeamRepository';
import {TeamState} from '../../../team/TeamState';
import {UserState} from '../../../user/UserState';
import {registerReactComponent, useKoSubscribableChildren} from 'Util/ComponentUtil';
import ModalComponent from 'Components/ModalComponent';
import SearchInput from 'Components/SearchInput';
import UserSearchableList from 'Components/UserSearchableList';
import TextInputForwarded from 'Components/TextInput/TextInput';
import BaseToggle from 'Components/toggle/BaseToggle';
import InfoToggle from 'Components/toggle/InfoToggle';
import {User} from '../../../entity/User';
import {ACCESS_STATE} from '../../../conversation/AccessState';
import Icon from 'Components/Icon';
import {t} from 'Util/LocalizerUtil';
import {onEscKey, offEscKey, handleEnterDown} from 'Util/KeyboardUtil';
import {
  ACCESS_TYPES,
  teamPermissionsForAccessState,
  toggleFeature,
} from '../../../conversation/ConversationAccessPermission';
import {initFadingScrollbar} from '../../../ui/fadingScrollbar';
import {Config} from '../../../Config';
import {isProtocolOption, ProtocolOption} from '../../../guards/Protocol';

interface GroupCreationModalProps {
  conversationRepository: ConversationRepository;
  searchRepository: SearchRepository;
  teamRepository: TeamRepository;
  userState?: UserState;
  teamState?: TeamState;
}

enum GroupCreationModalState {
  DEFAULT = 'GroupCreationModal.STATE.DEFAULT',
  PARTICIPANTS = 'GroupCreationModal.STATE.PARTICIPANTS',
  PREFERENCES = 'GroupCreationModal.STATE.PREFERENCES',
}

const logger = getLogger('GroupCreationModal');

const GroupCreationModal: React.FC<GroupCreationModalProps> = ({
  conversationRepository,
  searchRepository,
  teamRepository,
  userState = container.resolve(UserState),
  teamState = container.resolve(TeamState),
}) => {
  const defaultProtocol = teamState.teamFeatures().mls.config.defaultProtocol;
  const protocolOptions: ProtocolOption[] = [ConversationProtocol.PROTEUS, ConversationProtocol.MLS].map(protocol => ({
    label: `${t(`modalCreateGroupProtocolSelect.${protocol}`)}${
      protocol === defaultProtocol ? t(`modalCreateGroupProtocolSelect.default`) : ''
    }`,
    value: protocol,
  }));

  const initialProtocol = protocolOptions.find(protocol => protocol.value === defaultProtocol)!;

  const [isShown, setIsShown] = useState<boolean>(false);
  const [selectedContacts, setSelectedContacts] = useState<User[]>([]);
  const [enableReadReceipts, setEnableReadReceipts] = useState<boolean>(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolOption>(initialProtocol);
  const [showContacts, setShowContacts] = useState<boolean>(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState<boolean>(false);
  const [accessState, setAccessState] = useState<ACCESS_STATE>(ACCESS_STATE.TEAM.GUESTS_SERVICES);
  const [nameError, setNameError] = useState<string>('');
  const [groupName, setGroupName] = useState<string>('');
  const [participantsInput, setParticipantsInput] = useState<string>('');
  const [groupCreationState, setGroupCreationState] = useState<GroupCreationModalState>(
    GroupCreationModalState.DEFAULT,
  );

  const maxNameLength = ConversationRepository.CONFIG.GROUP.MAX_NAME_LENGTH;
  const maxSize = ConversationRepository.CONFIG.GROUP.MAX_SIZE;

  const onEscape = () => setIsShown(false);
  const {isTeam, isMLSEnabled: isMLSEnabledForTeam} = useKoSubscribableChildren(teamState, ['isTeam', 'isMLSEnabled']);
  const enableMlsCheckbox = isMLSEnabledForTeam || Config.getConfig().FEATURE.ENABLE_MLS;

  useEffect(() => {
    const showCreateGroup = (_: string, userEntity: User) => {
      setEnableReadReceipts(isTeam);
      setIsShown(true);
      setGroupCreationState(GroupCreationModalState.PREFERENCES);

      if (userEntity) {
        setSelectedContacts([...selectedContacts, userEntity]);
      }
    };

    amplify.subscribe(WebAppEvents.CONVERSATION.CREATE_GROUP, showCreateGroup);
  }, []);

  useEffect(() => {
    setSelectedProtocol(protocolOptions.find(protocol => protocol.value === selectedProtocol.value)!);
  }, [defaultProtocol]);

  const onClose = () => {
    setIsCreatingConversation(false);
    setNameError('');
    setGroupName('');
    setParticipantsInput('');
    setSelectedContacts([]);
    setGroupCreationState(GroupCreationModalState.DEFAULT);
    setAccessState(ACCESS_STATE.TEAM.GUESTS_SERVICES);
  };

  const stateIsPreferences = groupCreationState === GroupCreationModalState.PREFERENCES;
  const stateIsParticipants = groupCreationState === GroupCreationModalState.PARTICIPANTS;
  const isServicesRoom = accessState === ACCESS_STATE.TEAM.SERVICES;
  const isGuestAndServicesRoom = accessState === ACCESS_STATE.TEAM.GUESTS_SERVICES;
  const isGuestRoom = accessState === ACCESS_STATE.TEAM.GUEST_ROOM;
  const isGuestEnabled = isGuestRoom || isGuestAndServicesRoom;
  const isServicesEnabled = isServicesRoom || isGuestAndServicesRoom;

  useEffect(() => {
    if (stateIsPreferences) {
      onEscKey(onEscape);
      return;
    }
    offEscKey(onEscape);
  }, [stateIsPreferences]);

  useEffect(() => {
    let timerId: number;
    if (stateIsParticipants) {
      timerId = window.setTimeout(() => setShowContacts(true));
    } else {
      setShowContacts(false);
    }
    return () => {
      window.clearTimeout(timerId);
    };
  }, [stateIsParticipants]);

  const clickOnCreate = async (): Promise<void> => {
    if (!isCreatingConversation) {
      setIsCreatingConversation(true);

      try {
        const conversationEntity = await conversationRepository.createGroupConversation(
          selectedContacts,
          groupName,
          isTeam ? accessState : undefined,
          {
            protocol: selectedProtocol.value,
            receipt_mode: enableReadReceipts ? RECEIPT_MODE.ON : RECEIPT_MODE.OFF,
          },
        );
        setIsShown(false);
        amplify.publish(WebAppEvents.CONVERSATION.SHOW, conversationEntity, {});
      } catch (error) {
        setIsCreatingConversation(false);
        logger.error(error);
      }
    }
  };

  const onGroupNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {value} = event.target;

    const trimmedNameInput = value.trim();
    const nameTooLong = trimmedNameInput.length > maxNameLength;
    const nameTooShort = !trimmedNameInput.length;

    setGroupName(value);
    if (nameTooLong) {
      return setNameError(t('groupCreationPreferencesErrorNameLong'));
    } else if (nameTooShort) {
      return setNameError(t('groupCreationPreferencesErrorNameShort'));
    }
    setNameError('');
  };

  const groupNameLength = groupName.length;

  const hasNameError = nameError.length > 0;

  const clickOnNext = (): void => {
    const nameTooLong = groupNameLength > maxNameLength;

    if (groupNameLength && !nameTooLong) {
      setGroupCreationState(GroupCreationModalState.PARTICIPANTS);
    }
  };

  const contacts = useMemo(() => {
    if (showContacts) {
      if (!isTeam) {
        return userState.connectedUsers();
      }

      if (isGuestEnabled) {
        return teamState.teamUsers();
      }

      return teamState.teamMembers().sort(sortUsersByPriority);
    }
    return [];
  }, [isGuestEnabled, isTeam, showContacts, teamState, userState]);

  const clickOnToggle = (feature: number): void => {
    const newAccessState = toggleFeature(feature, accessState);
    setAccessState(newAccessState);
  };
  const clickOnToggleServicesMode = () => clickOnToggle(ACCESS_TYPES.SERVICE);
  const clickOnToggleGuestMode = () => clickOnToggle(teamPermissionsForAccessState(ACCESS_STATE.TEAM.GUEST_FEATURES));
  const clickOnBack = (): void => {
    setGroupCreationState(GroupCreationModalState.PREFERENCES);
  };

  const participantsActionText = selectedContacts.length
    ? t('groupCreationParticipantsActionCreate')
    : t('groupCreationParticipantsActionSkip');
  const isInputValid = groupNameLength && !nameError.length;

  return (
    <StyledApp themeId={THEME_ID.DEFAULT}>
      <div id="group-creation-modal" className="group-creation__modal">
        <ModalComponent
          wrapperCSS={{overflow: 'unset', overflowY: 'unset'}}
          isShown={isShown}
          onClosed={onClose}
          data-uie-name="group-creation-label"
        >
          <div className="modal__header modal__header--list">
            {stateIsParticipants && (
              <>
                <button
                  className="button-reset-default"
                  type="button"
                  onClick={clickOnBack}
                  aria-label={t('accessibility.groupCreationParticipantsActionBack')}
                  data-uie-name="go-back"
                >
                  <Icon.ArrowLeft aria-hidden="true" className="modal__header__button" />
                </button>

                <h2 id="group-creation-label" className="modal__header__title" data-uie-name="status-people-selected">
                  {selectedContacts.length
                    ? t('groupCreationParticipantsHeaderWithCounter', selectedContacts.length)
                    : t('groupCreationParticipantsHeader')}
                </h2>

                <Button
                  className="group-creation__action enabled accent-text"
                  css={{marginBottom: 0}}
                  type="button"
                  onClick={clickOnCreate}
                  aria-label={participantsActionText}
                  data-uie-name="do-create-group"
                  variant={ButtonVariant.TERTIARY}
                >
                  {participantsActionText}
                </Button>
              </>
            )}
            {stateIsPreferences && (
              <>
                <button
                  className="button-reset-default"
                  type="button"
                  onClick={() => setIsShown(false)}
                  aria-label={t('accessibility.groupCreationActionCloseModal')}
                  data-uie-name="do-close"
                >
                  <Icon.Close aria-hidden="true" className="modal__header__button" />
                </button>

                <h2 id="group-creation-label" className="modal__header__title">
                  {t('groupCreationPreferencesHeader')}
                </h2>

                <Button
                  id="group-go-next"
                  className={cx('group-creation__action', {
                    'accent-text': groupNameLength,
                    enabled: isInputValid,
                  })}
                  css={{marginBottom: 0}}
                  disabled={!isInputValid}
                  type="button"
                  onClick={clickOnNext}
                  aria-label={t('groupCreationPreferencesAction')}
                  data-uie-name="go-next"
                  variant={ButtonVariant.TERTIARY}
                >
                  {t('groupCreationPreferencesAction')}
                </Button>
              </>
            )}
          </div>
          {stateIsParticipants && (
            <SearchInput
              input={participantsInput}
              setInput={setParticipantsInput}
              selectedUsers={selectedContacts}
              setSelectedUsers={setSelectedContacts}
              placeholder={t('groupCreationParticipantsPlaceholder')}
              enter={clickOnCreate}
            />
          )}

          {stateIsParticipants && (
            <div className="group-creation__list" ref={initFadingScrollbar}>
              {contacts.length > 0 && (
                <UserSearchableList
                  users={contacts}
                  filter={participantsInput}
                  selected={selectedContacts}
                  onUpdateSelectedUsers={setSelectedContacts}
                  searchRepository={searchRepository}
                  teamRepository={teamRepository}
                  conversationRepository={conversationRepository}
                  noUnderline
                />
              )}
            </div>
          )}
          {/* eslint jsx-a11y/no-autofocus : "off" */}
          {stateIsPreferences && (
            <>
              <div className="modal-input-wrapper">
                <TextInputForwarded
                  autoFocus
                  label={t('groupCreationPreferencesPlaceholder')}
                  placeholder={t('groupCreationPreferencesPlaceholder')}
                  uieName="enter-group-name"
                  name="enter-group-name"
                  errorUieName="error-group-name"
                  onCancel={() => setGroupName('')}
                  onChange={onGroupNameChange}
                  onBlur={event => {
                    const {value} = event.target as HTMLInputElement;
                    const trimmedName = value.trim();
                    setGroupName(trimmedName);
                  }}
                  onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    handleEnterDown(event, clickOnNext);
                  }}
                  value={groupName}
                  isError={hasNameError}
                  errorMessage={nameError}
                />
              </div>
              {isTeam && (
                <>
                  <p
                    className="modal__info"
                    style={{visibility: hasNameError ? 'hidden' : 'visible'}}
                    data-uie-name="status-group-size-info"
                  >
                    {t('groupSizeInfo', maxSize)}
                  </p>
                  <hr className="group-creation__modal__separator" />
                  <BaseToggle
                    className="modal-style"
                    isChecked={isGuestEnabled}
                    setIsChecked={clickOnToggleGuestMode}
                    extendedInfo
                    extendedInfoText={t('guestRoomToggleInfoExtended')}
                    infoText={t('guestRoomToggleInfo')}
                    toggleName={t('guestOptionsTitle')}
                    toggleId="guests"
                  />
                  <BaseToggle
                    className="modal-style"
                    isChecked={isServicesEnabled}
                    setIsChecked={clickOnToggleServicesMode}
                    extendedInfo
                    extendedInfoText={t('servicesRoomToggleInfoExtended')}
                    infoText={t('servicesRoomToggleInfo')}
                    toggleName={t('servicesOptionsTitle')}
                    toggleId="services"
                  />
                  <InfoToggle
                    className="modal-style"
                    dataUieName="read-receipts"
                    info={t('readReceiptsToggleInfo')}
                    isChecked={enableReadReceipts}
                    setIsChecked={setEnableReadReceipts}
                    isDisabled={false}
                    name={t('readReceiptsToggleName')}
                  />
                  {enableMlsCheckbox && (
                    <>
                      <Select
                        id="select-protocol"
                        onChange={option => {
                          if (isProtocolOption(option)) {
                            setSelectedProtocol(option);
                          }
                        }}
                        dataUieName="select-protocol"
                        options={protocolOptions}
                        value={selectedProtocol}
                        label={t('modalCreateGroupProtocolHeading')}
                        menuPosition="absolute"
                        wrapperCSS={{marginBottom: 0}}
                      />
                      <p className="modal__info" data-uie-name="status-group-protocol-info">
                        {t('modalCreateGroupProtocolInfo')}
                      </p>
                    </>
                  )}
                  <br />
                </>
              )}
            </>
          )}
        </ModalComponent>
      </div>
    </StyledApp>
  );
};

registerReactComponent('group-creation-modal', GroupCreationModal);