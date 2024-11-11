/*
 * Wire
 * Copyright (C) 2024 Wire Swiss GmbH
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

import {Button, ButtonVariant} from '@wireapp/react-ui-kit';

import * as Icon from 'Components/Icon';
import {ModalComponent} from 'Components/Modals/ModalComponent';
import {t} from 'Util/LocalizerUtil';

import {
  buttonCss,
  confirmLeaveModalBodyCss,
  confirmLeaveModalButtonsCss,
  confirmLeaveModalWrapperCss,
} from './TeamCreation.styles';

interface Props {
  isShown: boolean;
  onClose: () => void;
  onLeave: () => void;
}

export const ConfirmLeaveModal = ({isShown, onClose, onLeave}: Props) => {
  return (
    <ModalComponent
      isShown={isShown}
      onBgClick={onClose}
      onClosed={onClose}
      data-uie-name="confirm-leave-modal"
      wrapperCSS={confirmLeaveModalWrapperCss}
    >
      <div className="modal__header">
        <h2 className="modal__header__title" data-uie-name="confirm-leave-modal-title">
          {t('teamCreationLeaveModalTitle')}
        </h2>
        <button type="button" className="modal__header__button" onClick={onClose} data-uie-name="do-close">
          <Icon.CloseIcon />
        </button>
      </div>

      <div className="modal__body" css={confirmLeaveModalBodyCss}>
        <p className="text-regular" data-uie-name="confirm-leave-modal-sub-title">
          {t('teamCreationLeaveModalSubTitle')}
        </p>

        <div className="modal__buttons" css={confirmLeaveModalButtonsCss}>
          <Button onClick={onClose} css={buttonCss} data-uie-name="do-continue-team-creation">
            {t('teamCreationLeaveModalSuccessBtn')}
          </Button>
          <Button css={buttonCss} variant={ButtonVariant.SECONDARY} onClick={onLeave} data-uie-name="do-leave">
            {t('teamCreationLeaveModalLeaveBtn')}
          </Button>
        </div>
      </div>
    </ModalComponent>
  );
};
