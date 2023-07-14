import {HiddenSelect, HiddenSelectProps} from '../src';
import {Item} from 'react-stately';
import React, {useRef} from 'react';
import {render, screen} from '@testing-library/react';
import {SelectProps, useSelectState} from '@react-stately/select';
import userEvent from '@testing-library/user-event';

const HiddenSelectExample = (props: Partial<SelectProps<{ key: number, value: string }>> & { hiddenProps?: Partial<HiddenSelectProps<any>> }) => {
  const triggerRef = useRef();
  const state = useSelectState({
    children: (item) => (
      <Item>{item.value}</Item>
    ), ...props
  });

  return (
    <>
      <HiddenSelect
        label={props.label}
        state={state}
        triggerRef={triggerRef}
        {...props.hiddenProps} />
      <button ref={triggerRef}>trigger</button>
    </>
  );
};

const makeItems = (size: number) => (new Array(size).fill('')).map((__, index) => ({
  key: index + 1,
  value: `${index + 1}`
}));

describe('<HiddenSelect />', () => {
  it('should successfully render for collection.size <= 300 and no selected key', () => {
    render(
      <HiddenSelectExample items={makeItems(5)} />
    );
  });

  it('should successfully render for collection.size > 300 with a name and no selected key', () => {
    render(
      <HiddenSelectExample
        hiddenProps={{
          name: 'select'
        }}
        items={makeItems(400)} />
    );
  });

  it('should trigger on onSelectionChange when select onchange is triggered (autofill)', () => {
    const onSelectionChange = jest.fn();
    render(
      <HiddenSelectExample
        label="select"
        onSelectionChange={onSelectionChange}
        items={makeItems(5)} />
    );

    const select = screen.getByLabelText('select');
    userEvent.selectOptions(select, '5');
    expect(onSelectionChange).toBeCalledWith('5');
  });

  it('should always add a data attribute data-rsp-a11y-ignore', () => {
    render(
      <HiddenSelectExample items={makeItems(5)} />
    );

    expect(screen.getByRole('listbox', {hidden: true}).dataset.rspA11yIgnore).toBeTruthy();
  });
});
