/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import React from 'react';

import type {Message} from '../../entity/message/Message';
import {registerReactComponent} from 'Util/ComponentUtil';

export interface EphemeralTimerProps {
  message: Message;
}

const EphemeralTimer: React.FC<EphemeralTimerProps> = ({message}) => {
  const started = message.ephemeral_started();
  const duration = ((message.ephemeral_expires() as number) - started) / 1000;

  return (
    <svg className="ephemeral-timer" viewBox="0 0 8 8" width={8} height={8}>
      <circle className="ephemeral-timer__background" cx={4} cy={4} r={3.5} />
      <circle
        data-uie-name="ephemeral-timer-circle"
        className="ephemeral-timer__dial"
        cx={4}
        cy={4}
        r={2}
        style={{animationDelay: `${(started - Date.now()) / 1000}s`, animationDuration: `${duration}s`}}
        transform="rotate(-90 4 4)"
      />
    </svg>
  );
};

export default EphemeralTimer;

registerReactComponent('ephemeral-timer', {
  component: EphemeralTimer,
  template: '<div data-bind="react: {message}"></div>',
});
