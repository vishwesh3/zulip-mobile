/* @flow strict-local */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';

import { Input, Label, OptionRow, ZulipButton } from '../common';
import styles from '../styles';
import { IconPrivate } from '../common/Icons';

const componentStyles = StyleSheet.create({
  optionRow: {
    paddingLeft: 8,
    paddingRight: 8,
  },
});

type Props = $ReadOnly<{|
  isNewStream: boolean,
  initialValues: {
    name: string,
    description: string,
    invite_only: boolean,
    is_announcement_only: boolean,
  },
  onComplete: (
    name: string,
    description: string,
    isPrivate: boolean,
    isAnnouncementOnly: boolean,
  ) => void,
|}>;

type State = {|
  name: string,
  description: string,
  isAnnouncementOnly: boolean,
  isPrivate: boolean,
|};

export default class EditStreamCard extends PureComponent<Props, State> {
  state = {
    name: this.props.initialValues.name,
    description: this.props.initialValues.description,
    isAnnouncementOnly: this.props.initialValues.is_announcement_only,
    isPrivate: this.props.initialValues.invite_only,
  };

  handlePerformAction = () => {
    const { onComplete } = this.props;
    const { name, description, isPrivate, isAnnouncementOnly } = this.state;
    onComplete(name, description, isPrivate, isAnnouncementOnly);
  };

  handleNameChange = (name: string) => {
    this.setState({ name });
  };

  handleDescriptionChange = (description: string) => {
    this.setState({ description });
  };

  handleIsPrivateChange = (isPrivate: boolean) => {
    this.setState({ isPrivate });
  };

  handleIsAnnouncementChange = (isAnnouncementOnly: boolean) => {
    this.setState({ isAnnouncementOnly });
  };

  render() {
    const { initialValues, isNewStream } = this.props;
    const { name } = this.state;

    return (
      <View>
        <Label text="Name" />
        <Input
          style={styles.marginBottom}
          placeholder="Name"
          autoFocus
          defaultValue={initialValues.name}
          onChangeText={this.handleNameChange}
        />
        <Label text="Description" />
        <Input
          style={styles.marginBottom}
          placeholder="Description"
          defaultValue={initialValues.description}
          onChangeText={this.handleDescriptionChange}
        />
        <OptionRow
          style={componentStyles.optionRow}
          Icon={IconPrivate}
          label="Private"
          value={this.state.isPrivate}
          onValueChange={this.handleIsPrivateChange}
        />
        <OptionRow
          style={componentStyles.optionRow}
          label="Restrict posting to organization administrators"
          value={this.state.isAnnouncementOnly}
          onValueChange={this.handleIsAnnouncementChange}
        />
        <ZulipButton
          style={styles.marginTop}
          text={isNewStream ? 'Create' : 'Update'}
          disabled={name.length === 0}
          onPress={this.handlePerformAction}
        />
      </View>
    );
  }
}
