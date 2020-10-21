import React, {
  FC,
  useRef,
  MouseEvent,
  FocusEvent,
  KeyboardEvent, ReactNode, useEffect,
} from 'react';
import Icon20Dropdown from '@vkontakte/icons/dist/20/dropdown';
import classNames from '../../lib/classNames';
import Spinner from '../Spinner/Spinner';
import CustomScrollView from '../CustomScrollView/CustomScrollView';
import ChipsInput, { ChipsInputOption, ChipsInputProps, ChipsInputValue, RenderChip } from '../ChipsInput/ChipsInput';
import CustomSelectOption, { CustomSelectOptionProps } from '../CustomSelectOption/CustomSelectOption';
import { useAdaptivity } from '../../hooks/useAdaptivity';
import { useChipsSelect } from './useChipsSelect';

export interface ChipsSelectProps<Option extends ChipsInputOption> extends ChipsInputProps<Option> {
  popupDirection?: 'top' | 'bottom';
  options?: Option[];
  filterFn?: (value?: string, option?: Option, getOptionLabel?: Pick<ChipsInputProps<ChipsInputOption>, 'getOptionLabel'>['getOptionLabel']) => boolean;
  creatable?: boolean;
  fetching?: boolean;
  renderOption?: (props: CustomSelectOptionProps) => ReactNode;
  showSelected?: boolean;
  creatableText?: string;
  emptyText?: string;
  inputClass?: string;
}

type focusActionType = 'next' | 'prev';

const FOCUS_ACTION_NEXT: focusActionType = 'next';
const FOCUS_ACTION_PREV: focusActionType = 'prev';

const ChipsSelect: FC<ChipsSelectProps<ChipsInputOption>> = <Option extends ChipsInputOption>(props: ChipsSelectProps<Option>) => {
  const {
    style, onBlur, onFocus, onClick, onKeyDown, className, fetching, renderOption, emptyText, inputClass,
    getRef, getRootRef, disabled, placeholder, tabIndex, getOptionValue, getOptionLabel, showSelected,
    getNewOptionData, renderChip, popupDirection, creatable, filterFn, inputValue, creatableText,
    ...restProps
  } = props;

  const { sizeY } = useAdaptivity();
  const scrollViewRef = useRef<CustomScrollView>(null);
  const {
    fieldValue, selectedOptions, opened, setOpened, addOptionFromInput,
    setSelectedOptions, filteredOptions, addOption, handleInputChange, clearInput,
    focusedOption, setFocusedOption, focusedOptionIndex, setFocusedOptionIndex,
  } = useChipsSelect(props);

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    setOpened(true);
    setFocusedOptionIndex(0);
    onFocus(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setOpened(false);
    onBlur(e);
  };

  const scrollToElement = (index: number, center = false) => {
    const scrollView = scrollViewRef.current;
    const dropdown = scrollView.box.current;
    const item = dropdown ? (dropdown.children[index] as HTMLElement) : null;

    if (!item) {
      return;
    }

    const dropdownHeight = dropdown.offsetHeight;
    const scrollTop = dropdown.scrollTop;
    const itemTop = item.offsetTop;
    const itemHeight = item.offsetHeight;

    if (center) {
      dropdown.scrollTop = itemTop - dropdownHeight / 2 + itemHeight / 2;
    } else if (itemTop + itemHeight > dropdownHeight + scrollTop) {
      dropdown.scrollTop = itemTop - dropdownHeight + itemHeight;
    } else if (itemTop < scrollTop) {
      dropdown.scrollTop = itemTop;
    }
  };

  const focusOptionByIndex = (index: number, oldIndex: number) => {
    const length = filteredOptions.length + Number(creatable);

    if (index < 0) {
      index = length - 1;
    } else if (index >= length) {
      index = 0;
    }

    if (index === oldIndex) {
      return;
    }

    scrollToElement(index);
    setFocusedOptionIndex(index);
  };

  const focusOption = (nextIndex: number|null, type: focusActionType) => {
    let index = typeof nextIndex !== 'number' ? -1 : nextIndex;

    if (type === FOCUS_ACTION_NEXT) {
      index = index + 1;
    } else if (type === FOCUS_ACTION_PREV) {
      index = index - 1;
    }

    focusOptionByIndex(index, focusedOptionIndex);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown(e);

    if (e.key === 'ArrowUp' && !e.defaultPrevented) {
      e.preventDefault();

      if (!opened) {
        setOpened(true);
        setFocusedOptionIndex(0);
      } else {
        focusOption(focusedOptionIndex, FOCUS_ACTION_PREV);
      }
    }

    if (e.key === 'ArrowDown' && !e.defaultPrevented) {
      e.preventDefault();

      if (!opened) {
        setOpened(true);
        setFocusedOptionIndex(0);
      } else {
        focusOption(focusedOptionIndex, FOCUS_ACTION_NEXT);
      }
    }

    if (e.key === 'Enter' && !e.defaultPrevented && opened) {
      const option = filteredOptions[focusedOptionIndex - Number(creatable)];

      if (option) {
        addOption(option);
        setFocusedOptionIndex(null);
        clearInput();
        setOpened(false);
        e.preventDefault();
      } else if (!creatable) {
        e.preventDefault();
      }
    }

    if (e.key === 'Escape' && !e.defaultPrevented && opened) {
      setOpened(false);
    }
  };

  useEffect(() => {
    let index = focusedOptionIndex - Number(creatable);

    if (filteredOptions[index]) {
      setFocusedOption(filteredOptions[index]);
    } else if (focusedOptionIndex === null || focusedOptionIndex === 0) {
      setFocusedOption(null);
    }
  }, [focusedOptionIndex, creatable, selectedOptions]);

  useEffect(() => {
    const index = focusedOption ? filteredOptions.findIndex(({ value }) => value === focusedOption.value) : -1;

    if (index === -1 && !!filteredOptions.length && !creatable) {
      setFocusedOption(filteredOptions[0]);
    }
  }, [filteredOptions, focusedOption, creatable]);

  const renderChipWrapper = (renderChipProps: RenderChip<Option>) => {
    const { onRemove } = renderChipProps;
    const onRemoveWrapper = (e: MouseEvent, value: ChipsInputValue) => {
      e.preventDefault();
      onRemove(e, value);
    };

    return renderChip({ ...renderChipProps, onRemove: onRemoveWrapper });
  };

  return (
    <div
      className={classNames('ChipsSelect', className)}
      ref={getRootRef}
    >
      <ChipsInput
        tabIndex={tabIndex}
        value={selectedOptions}
        inputValue={fieldValue}
        getNewOptionData={getNewOptionData}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        renderChip={renderChipWrapper}
        onChange={setSelectedOptions}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={style}
        className={classNames(inputClass, {
          ['ChipsSelect__open']: opened,
          ['ChipsSelect__open--popupDirectionTop']: popupDirection === 'top',
        })}
        getRef={getRef}
        disabled={disabled}
        {...restProps}
        onInputChange={handleInputChange}
      />
      <div className="ChipsSelect__toggle">
        <Icon20Dropdown />
      </div>
      {opened &&
        <div
          className={classNames(`ChipsSelect__options--sizeY-${sizeY}`, {
            ['ChipsSelect__options']: opened,
            ['ChipsSelect__options--popupDirectionTop']: popupDirection === 'top',
          })}
          onMouseLeave={() => setFocusedOptionIndex(null)}
        >
          <CustomScrollView ref={scrollViewRef}>
            {fetching ? (
              <div className="ChipsSelect__fetching">
                <Spinner size="small" />
              </div>
            ) : (
              <>
                {creatable && (
                  <CustomSelectOption
                    index={0}
                    hovered={focusedOptionIndex === 0}
                    label={creatableText}
                    onMouseDown={addOptionFromInput}
                    onMouseEnter={() => setFocusedOptionIndex(0)}
                  />
                )}
                {!filteredOptions?.length && !creatable && emptyText ? (
                  <div className="ChipsSelect__empty">{emptyText}</div>
                ) :
                  filteredOptions.map((option: Option, i: number) => {
                    const index = creatable ? i + 1 : i;
                    const label = getOptionLabel(option);
                    const hovered = focusedOption && getOptionValue(option) === getOptionValue(focusedOption);
                    const selected = selectedOptions.find((selectedOption: Option) => {
                      return getOptionValue(selectedOption) === getOptionValue(option);
                    });

                    return renderOption({
                      option,
                      index,
                      hovered,
                      label,
                      selected: !!selected,
                      onMouseDown: () => {
                        addOption(option);
                        clearInput();
                      },
                      onMouseEnter: () => setFocusedOptionIndex(index),
                    });
                  })
                }
              </>
            )}
          </CustomScrollView>
        </div>
      }
    </div>
  );
};

ChipsSelect.defaultProps = {
  ...ChipsInput.defaultProps,
  creatable: false,
  fetching: false,
  showSelected: true,
  filterFn: (value, option, getOptionLabel) => {
    return (
      !value || value && getOptionLabel(option)?.toLowerCase()?.startsWith(value?.toLowerCase())
    );
  },
  renderOption({ index, label, ...otherProps }: CustomSelectOptionProps): ReactNode {
    return (
      <CustomSelectOption
        key={index}
        label={label}
        index={index}
        {...otherProps}
      />
    );
  },
};

export default ChipsSelect;
