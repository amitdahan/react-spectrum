/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import CheckmarkMedium from '@spectrum-icons/ui/CheckmarkMedium';
import ChevronLeft from '@spectrum-icons/workflow/ChevronLeft';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import {classNames, ClearSlots, SlotProvider} from '@react-spectrum/utils';
import {DOMAttributes, Node} from '@react-types/shared';
import {filterDOMProps, mergeProps, mergeRefs, useObjectRef, useSlotId} from '@react-aria/utils';
import {FocusRing} from '@react-aria/focus';
import {Grid} from '@react-spectrum/layout';
import InfoOutline from '@spectrum-icons/workflow/InfoOutline';
// @ts-ignore
import intlMessages from '../intl/*.json';
import React, {Key, useMemo, useRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {Text} from '@react-spectrum/text';
import {TreeState} from '@react-stately/tree';
import {useLocale, useLocalizedStringFormatter} from '@react-aria/i18n';
import {useMenuContext, useMenuDialogContext} from './context';
import {useMenuItem} from '@react-aria/menu';

interface MenuItemProps<T> {
  item: Node<T>,
  state: TreeState<T>,
  isVirtualized?: boolean,
  onAction?: (key: Key) => void
}

/** @private */
export function MenuItem<T>(props: MenuItemProps<T>) {
  let {
    item,
    state,
    isVirtualized,
    onAction
  } = props;
  let stringFormatter = useLocalizedStringFormatter(intlMessages);
  let menuDialogContext = useMenuDialogContext();
  let {direction} = useLocale();
  let {triggerRef, ...subMenuTriggerProps} = menuDialogContext || {};
  // TODO rename all instances of menuDialogTrigger to something more generic to submenus
  // If menuDialogContext.isUnavailable is explicitly false, then disable all submenu behavior
  let isMenuDialogTrigger = !!menuDialogContext && menuDialogContext.isUnavailable !== false;
  let isUnavailable;
  let {
    closeOnSelect
  } = useMenuContext();

  let domProps = filterDOMProps(item.props);

  let {
    rendered,
    key
  } = item;

  if (isMenuDialogTrigger) {
    isUnavailable = menuDialogContext.isUnavailable;
  }

  let isDisabled = state.disabledKeys.has(key);
  let isSelectable = !isMenuDialogTrigger && state.selectionManager.selectionMode !== 'none';
  let isSelected = isSelectable && state.selectionManager.isSelected(key);
  let itemref = useRef<HTMLLIElement>(null);
  let ref = useObjectRef(useMemo(() => mergeRefs(itemref, triggerRef), [itemref, triggerRef]));
  let {
    menuItemProps,
    labelProps,
    descriptionProps,
    keyboardShortcutProps
  } = useMenuItem(
    {
      isSelected,
      isDisabled,
      'aria-label': item['aria-label'],
      key,
      closeOnSelect,
      isVirtualized,
      onAction,
      ...subMenuTriggerProps
    },
    state,
    ref
  );
  let endId = useSlotId();
  let endProps: DOMAttributes = {};
  if (endId) {
    endProps.id = endId;
    menuItemProps['aria-describedby'] = [menuItemProps['aria-describedby'], endId].filter(Boolean).join(' ');
  }

  let contents = typeof rendered === 'string'
    ? <Text>{rendered}</Text>
    : rendered;

  return (
    <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
      <li
        {...mergeProps(menuItemProps, domProps)}
        ref={ref}
        className={classNames(
          styles,
          'spectrum-Menu-item',
          {
            'is-disabled': isDisabled,
            'is-selected': isSelected,
            'is-selectable': isSelectable,
            'is-open': state.expandedKeys.has(key)
          }
        )}>
        <Grid
          UNSAFE_className={
            classNames(
              styles,
              'spectrum-Menu-itemGrid'
            )
          }>
          <ClearSlots>
            <SlotProvider
              slots={{
                text: {UNSAFE_className: styles['spectrum-Menu-itemLabel'], ...labelProps},
                end: {UNSAFE_className: styles['spectrum-Menu-end'], ...endProps},
                icon: {UNSAFE_className: styles['spectrum-Menu-icon'], size: 'S'},
                description: {UNSAFE_className: styles['spectrum-Menu-description'], ...descriptionProps},
                keyboard: {UNSAFE_className: styles['spectrum-Menu-keyboard'], ...keyboardShortcutProps},
                chevron: {UNSAFE_className: styles['spectrum-Menu-chevron'], size: 'S'}
              }}>
              {contents}
              {isSelected &&
                <CheckmarkMedium
                  slot="checkmark"
                  UNSAFE_className={
                    classNames(
                      styles,
                      'spectrum-Menu-checkmark'
                    )
                  } />
              }
              {
                isUnavailable && <InfoOutline slot="end" size="XS" alignSelf="center" aria-label={stringFormatter.format('unavailable')} />
              }
              {
                // TODO: labeling for chevron
                // TODO: need to push the chevron a bit to the right some more still since the svg is 18x18 and has extra whitespace to the right of the chevron tip.
                // Maybe make its own slot and add a negative margin and increase the padding-inline-start by an equal amount?
                !isUnavailable && isMenuDialogTrigger && (direction === 'rtl' ? <ChevronLeft slot="chevron" /> : <ChevronRight slot="chevron" />)
              }
            </SlotProvider>
          </ClearSlots>
        </Grid>
      </li>
    </FocusRing>
  );
}
