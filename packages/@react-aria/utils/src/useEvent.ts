/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {RefObject, useEffect} from 'react';
import {useEffectEvent} from './useEffectEvent';

export function useEvent<K extends keyof GlobalEventHandlersEventMap>(
  ref: RefObject<EventTarget>,
  event: K,
  handler?: (this: Document, ev: GlobalEventHandlersEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
) {
  let handleEvent = useEffectEvent(handler);
  let isDisabled = handler == null;

  useEffect(() => {
    if (isDisabled || !ref.current) {
      return;
    }

    let element = ref.current;
    element.addEventListener(event, handleEvent as EventListener, options);
    return () => {
      element.removeEventListener(event, handleEvent as EventListener, options);
    };
  }, [ref, event, options, isDisabled, handleEvent]);
}
