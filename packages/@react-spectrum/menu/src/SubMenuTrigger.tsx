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

import {classNames, useIsMobileDevice} from '@react-spectrum/utils';
import {MenuContext, MenuDialogContext, useMenuStateContext} from './context';
import {Placement} from '@react-types/overlays';
import {Popover, Tray} from '@react-spectrum/overlays';
import React, {Key, ReactElement, useRef} from 'react';
import {SpectrumMenuTriggerProps} from '@react-types/menu';
import styles from '@adobe/spectrum-css-temp/components/menu/vars.css';
import {useMenuTriggerState} from '@react-stately/menu';

// TODO: Change from MenuTrigger, omit 'trigger' since we don't want to support long press on a submenu
interface SubMenuTriggerProps extends Omit<SpectrumMenuTriggerProps, 'trigger' | 'isOpen' | 'defaultOpen'> {
  targetKey: Key
}

// TODO: User doesn't need to provide target key, we handle that
export interface SpectrumSubMenuTriggerProps extends Omit<SubMenuTriggerProps, 'targetKey'> {}

// TODO: for now, copies MenuTrigger and pulls some stuff from ContextualHelpTrigger. After getting stuff rendering
// evaluate if we could instead just modify MenuTrigger and reuse it. At the moment we don't want all the stuff from useMenuTrigger for a
// sub menu item trigger (aka keydown down arrow opens/long press handling)

// TODO: Think about if it should reuse the same state MenuTrigger uses or use its own
// How to control it so that only one submenu can be open at once. At the moment we actually handle this via useMenuItem since it calls setExpandedKey with a single key on open
// and we don't allow isOpen/defaultOpen on SubMenus

// TODO: got rid of user provided ref support since it doesn't really make sense for submenus IMO
function SubMenuTrigger(props: SubMenuTriggerProps) {
  let triggerRef = useRef<HTMLLIElement>();
  let menuRef = useRef<HTMLUListElement>();
  let {
    children,
    align = 'start',
    shouldFlip = true,
    direction = 'end top',
    closeOnSelect
  } = props;

  let [menuTrigger, menu] = React.Children.toArray(children);
  // TODO: maybe don't need useMenuTriggerState and borrow what ContextualHelpTrigger does
  // If we have each SubMenuTrigger create its own open/close state, then how do we make sure only one menu is open at a single time
  // For now grab the tree state from the parent, decide later if we instead want each level of MenuTrigger to have a state tracking the
  // expanded state of its immediate children and thus enforce that only a single one is open at a time. Each MenuTrigger would then have its own open state
  // enforced by the expandedKeys state of its parent trigger.
  // Actually we already have each menu/submenu tracking its own tree state for its only level only, at least for the static case.

  // TODO: Change from MenuTrigger, will need to disable the SubMenuTrigger if disabledKey includes the wrapped item? Test in story
  // Actually already handled in useMenuItem for submenus?

  let {state: parentMenuState, container, menu: parentMenu} = useMenuStateContext();
  // TODO where does targetKey get set even? Check ContextualHelpTrigger
  // call useMenuTriggerState in place of useOverlayTriggerState since they are basically the same except for focusStrategy
  let subMenuState = useMenuTriggerState({isOpen: parentMenuState.expandedKeys.has(props.targetKey), onOpenChange: (val) => {
    if (!val) {
      if (parentMenuState.expandedKeys.has(props.targetKey)) {
        // TODO: hides menu, currenly triggered since hovering away causes focus to move out of the sub menu and triggers a close via useOverlay
        parentMenuState.toggleKey(props.targetKey);
      }
    }
  }});

  // TODO: double check if I really need the below
  let onExit = () => {
    // if focus was already moved back to a menu item, don't need to do anything
    if (!parentMenu.current.contains(document.activeElement)) {
      // need to return focus to the trigger because hitting Esc causes focus to go to the subdialog, which is then unmounted
      // this leads to blur never being fired nor focus on the body
      triggerRef.current.focus();
    }
  };

  // TODO maybe call useMenuTrigger and extract the press props/other stuff? Right now most of that stuff is handled in useMenuItem
  // but I could add a prop to useMenuTrigger to classify a menu as a subMenu and change the behavior accordingly. This will also allow me to get the proper id + aria-labelledb pairing
  // for the submenu item trigger and the submenu itself and the other aria attributes (aria-controls)

  let initialPlacement: Placement;
  switch (direction) {
    case 'left':
    case 'right':
    case 'start':
    case 'end':
      initialPlacement = `${direction} ${align === 'end' ? 'bottom' : 'top'}` as Placement;
      break;
    case 'bottom':
    case 'top':
    default:
      initialPlacement = `${direction} ${align}` as Placement;
  }

  let isMobile = useIsMobileDevice();
  // TODO: figure out what exactly we need to propagate down
  let menuContext = {
    // TODO: doesn't have menuProps from useMenuTrigger, does it need any? Perhaps autoFocus and aria-labelledBy?
    state: subMenuState,
    ref: menuRef,
    // TODO: need onClose to close submenu on submenu item select/arrowleft
    onClose: subMenuState.close,
    closeOnSelect,
    // TODO: we don't call useMenuTrigger so need an autofocus value for when the submenu is opened by keyboard/hover/press
    // useMenuItem currently handles opening the submenu, perhaps copy over the pressProps/some of the keydown stuff from useMenuTrigger's implementation
    // and move it to a useSubMenuTrigger hook or modify useMenuTrigger so it can distingush between the typical menuTrigger stuff. Then pass that stuff
    // via context to useMenuItem or have useMenuItem have that logic baked in?
    autoFocus: subMenuState.focusStrategy || true,
    UNSAFE_style: isMobile ? {
      width: '100%',
      maxHeight: 'inherit'
    } : undefined,
    UNSAFE_className: classNames(styles, {'spectrum-Menu-popover': !isMobile}),
    isSubMenu: true
  };


  let overlay;
  // TODO: handle tray experience later
  if (isMobile) {
    overlay = (
      <Tray state={subMenuState}>
        {menu}
      </Tray>
    );
  } else {
    overlay = (
      <Popover
        // Props from ContextualHelpTrigger implementation
        onExit={onExit}
        // TODO Omitted onBlurWithin, doesn't seem like it was necessary?
        container={container.current}
        // TODO: for now placement is customizable by user as per discussion, still need offset
        // will need to test all the combinations
        offset={-10}
        isNonModal
        enableBothDismissButtons
        disableFocusManagement

        // Props from MenuTriggerImplementation
        UNSAFE_style={{clipPath: 'unset'}}
        state={subMenuState}
        triggerRef={triggerRef}
        scrollRef={menuRef}
        placement={initialPlacement}
        hideArrow
        shouldFlip={shouldFlip}>
        {menu}
      </Popover>
    );
  }

  let openSubMenu = (focusStrategy) => {
    // TODO: call setExpandedKeys here or just do it in useMenuItem?
    // parentMenuState.setExpandedKeys()
    subMenuState.open(focusStrategy);
  };

  return (
    <>
      {/* TODO rename MenuDialogContext to something more generic */}
      <MenuDialogContext.Provider value={{triggerRef, openSubMenu}}>{menuTrigger}</MenuDialogContext.Provider>

      <MenuContext.Provider value={menuContext}>
        {overlay}
      </MenuContext.Provider>
    </>
  );
}

// TODO: update the below props
SubMenuTrigger.getCollectionNode = function* (props: SpectrumSubMenuTriggerProps) {
  let [trigger] = React.Children.toArray(props.children) as ReactElement[];
  let [, content] = props.children as [ReactElement, ReactElement];
  // console.log('trigger content', trigger, content);
  yield {
    element: React.cloneElement(trigger, {...trigger.props, hasChildItems: true}),
    wrapper: (element) => (
      <SubMenuTrigger key={element.key} targetKey={element.key} {...props}>
        {element}
        {content}
      </SubMenuTrigger>
    )
  };
};

let _SubMenuTrigger = SubMenuTrigger as (props: SpectrumSubMenuTriggerProps) => JSX.Element;
export {_SubMenuTrigger as SubMenuTrigger};
