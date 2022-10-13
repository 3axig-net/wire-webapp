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

import BaseToggle from './BaseToggle';
import {render, fireEvent} from '@testing-library/react';

describe('BaseToggle', () => {
  it('toggles check property', async () => {
    let isChecked = false;
    const props = {
      isChecked,
      isDisabled: false,
      setIsChecked: (updatedIsChecked: boolean) => {
        isChecked = updatedIsChecked;
      },
    };

    const {getByTestId} = render(<BaseToggle {...props} />);

    const input = getByTestId('allow-base-toggle-input');
    fireEvent.click(input);

    expect(isChecked).toBe(true);
  });
});