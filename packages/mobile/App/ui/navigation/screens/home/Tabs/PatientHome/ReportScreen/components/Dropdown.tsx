import React, { FC, useRef, useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { calculateDropdownPosition } from '~/ui/helpers/screen';
import { OptionItem, OptionItemText, ReportSelectorContainer, DropdownContainer, OptionsContainer, PlaceholderContainer } from './DropdownStyledComponents';

interface OptionItem {
  value: string;
  label: string;
}

interface IDropdownProps {
  options: OptionItem[];
  selectedItem?: string;
  handleSelect: (value: string) => void;
}

const DropdownItem: FC<{
  item: OptionItem;
  onPress: () => void;
}> = props => (
  <TouchableOpacity onPress={props.onPress}>
    <OptionItem>
      <OptionItemText>{props.item.label}</OptionItemText>
    </OptionItem>
  </TouchableOpacity>
);

export const Dropdown: FC<IDropdownProps> = props => {
  const [isOpen, setIsOpen] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const placeholderRef = useRef<View>(null);
  const dropdownRef = useRef<View>(null);
  const selectedItem = props.selectedItem
    ? props.options.find(item => item.value === props.selectedItem)
    : props.options[0];

  const handleSelectItem = (item: OptionItem): void => {
    props.handleSelect(item.value);
    setIsOpen(false);
  };

  const handlePress = (): void => {
    placeholderRef?.current?.measureInWindow((x, y) => {
      setTranslateY(calculateDropdownPosition(y, props.options?.length ?? 0));
      setTranslateX(x);
      setIsOpen(isCurrentOpen => !isCurrentOpen);
    });
  };

  return (
    <View>
      <ReportSelectorContainer ref={placeholderRef}>
        <TouchableWithoutFeedback onPress={handlePress} style={{ flex: 1 }}>
          <PlaceholderContainer>
            <OptionItemText>{!props.options.length ? 'No options available' : selectedItem.label}</OptionItemText>
            <Icon name={isOpen ? 'caret-up' : 'caret-down'} />
          </PlaceholderContainer>
        </TouchableWithoutFeedback>
      </ReportSelectorContainer>
      <Modal
        visible={isOpen}
        transparent
        onRequestClose={(): void => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={(): void => setIsOpen(false)}>
          <DropdownContainer>
            <OptionsContainer
              ref={dropdownRef}
              style={{ transform: [{ translateY, translateX }] }}
            >
              <ScrollView>
                {props.options?.map((item: OptionItem) => (
                  <DropdownItem
                    key={item.value}
                    item={item}
                    onPress={(): void => handleSelectItem(item)}
                  />
                ))}
              </ScrollView>
            </OptionsContainer>
          </DropdownContainer>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};
