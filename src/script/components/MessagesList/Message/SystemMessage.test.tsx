/*
 * Wire
 * Copyright (C) 2021 Wire Swiss GmbH
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

import ko from 'knockout';
import {DeleteConversationMessage} from 'src/script/entity/message/DeleteConversationMessage';
import {MessageTimerUpdateMessage} from 'src/script/entity/message/MessageTimerUpdateMessage';
import {ReceiptModeUpdateMessage} from 'src/script/entity/message/ReceiptModeUpdateMessage';
import {RenameMessage} from 'src/script/entity/message/RenameMessage';
import {SystemMessageType} from 'src/script/message/SystemMessageType';
import SystemMessage from './SystemMessage';
import {render} from '@testing-library/react';

jest.mock('Components/Icon', () => ({
  Edit: function EditIcon() {
    return <span data-uie-name="editicon" className="editicon"></span>;
  },
  Read: function ReadIcon() {
    return <span data-uie-name="readicon" className="readicon"></span>;
  },
  Timer: function TimerIcon() {
    return <span data-uie-name="timericon" className="timericon"></span>;
  },
}));

type SystemMessageUnion =
  | DeleteConversationMessage
  | MessageTimerUpdateMessage
  | ReceiptModeUpdateMessage
  | RenameMessage;

const createSystemMessage = (partialSystemMessage: Partial<SystemMessageUnion>) => {
  const systemMessage: Partial<SystemMessageUnion> = {
    caption: ko.pureComputed(() => '') as any,
    timestamp: ko.observable(Date.now()),
    unsafeSenderName: ko.pureComputed(() => ''),
    ...partialSystemMessage,
  };
  return systemMessage as SystemMessageUnion;
};

describe('SystemMessage', () => {
  it('shows edit icon for RenameMessage', async () => {
    const message = createSystemMessage({
      system_message_type: SystemMessageType.CONVERSATION_RENAME,
    });

    const {queryByTestId} = render(<SystemMessage message={message} />);

    expect(queryByTestId('element-message-system')).not.toBeNull();
    expect(queryByTestId('editicon')).not.toBeNull();
  });

  it('shows timer icon for MessageTimerUpdateMessage', async () => {
    const message = createSystemMessage({
      system_message_type: SystemMessageType.CONVERSATION_MESSAGE_TIMER_UPDATE,
    });

    const {queryByTestId} = render(<SystemMessage message={message} />);

    expect(queryByTestId('element-message-system')).not.toBeNull();
    expect(queryByTestId('timericon')).not.toBeNull();
  });

  it('shows read icon for ReceiptModeUpdateMessage', async () => {
    const message = createSystemMessage({
      system_message_type: SystemMessageType.CONVERSATION_RECEIPT_MODE_UPDATE,
    });

    const {queryByTestId} = render(<SystemMessage message={message} />);

    expect(queryByTestId('element-message-system')).not.toBeNull();
    expect(queryByTestId('readicon')).not.toBeNull();
  });
});