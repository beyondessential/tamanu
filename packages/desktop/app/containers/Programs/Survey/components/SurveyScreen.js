/**
* Tupaia MediTrak
* Copyright (c) 2017 Beyond Essential Systems Pty Ltd
**/

import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import PropTypes from 'prop-types';

import { QuestionScreen } from './QuestionScreen';
import { SubmitScreen } from './SubmitScreen';
import {
  Button,
  KeyboardSpacer,
  ProgressActionBar,
  Popup,
  StatusMessage,
  STATUS_MESSAGE_ERROR,
} from '../widgets';
import { SurveyTableOfContents } from './SurveyTableOfContents';
import { THEME_COLOR_ONE } from '../globalStyles';

import headerBackImage from '../images/x.png';

const LENGTH_OF_TRANSITION = 300;

export class DumbSurveyScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.state.params.clinicName,
    headerBackImage,
  })

  constructor(props) {
    super(props);

    this.state = {
      isTableOfContentsVisible: false,
      screenIndexAnimation: new Animated.Value(props.screenIndex),
      lastScreenIndex: null,
    };
    this.scrollViewRefs = [null, null];
  }

  componentWillReceiveProps(nextProps) {
    // During transition, make sure the incoming screen is set to the top
    const scrollViewRef = this.scrollViewRefs[nextProps.screenIndex % 2];
    if (scrollViewRef) {
      scrollViewRef.scrollTo({ x: 0, y: 0, animated: false });
    }
    if (nextProps.screenIndex !== this.props.screenIndex) {
      this.setState({
        lastScreenIndex: this.props.screenIndex,
      });
      this.state.screenIndexAnimation.stopAnimation();
      this.state.screenIndexAnimation.setValue(this.props.screenIndex);
      Animated.timing(
        this.state.screenIndexAnimation,
        {
          toValue: nextProps.screenIndex,
          duration: LENGTH_OF_TRANSITION,
        },
      ).start(() => { this.setState({ lastScreenIndex: null }); });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.screenIndex !== nextProps.screenIndex) return true;
    if (this.props.isSubmitting !== nextProps.isSubmitting) return true;
    if (this.props.errorMessage !== nextProps.errorMessage) return true;
    if (this.state !== nextState) return true;
    return false;
  }

  onToggleToc() {
    this.setState({ isTableOfContentsVisible: !this.state.isTableOfContentsVisible });
  }

  onSelectScreen(screenIndex) {
    const { onSelectSurveyScreen } = this.props;

    onSelectSurveyScreen(screenIndex);
    this.setState({ isTableOfContentsVisible: false });
  }

  getStyleForContent(forScreenIndex) {
    const { screenIndex: currentScreenIndex } = this.props;
    const lastScreenIndex = this.state.lastScreenIndex;
    const isCurrentScreen = forScreenIndex === currentScreenIndex;
    const isIncreasing = currentScreenIndex > lastScreenIndex;

    // Interpolations must be based on increasing input range
    const halfWay = currentScreenIndex - ((currentScreenIndex - lastScreenIndex) / 2);
    const inputRange = isIncreasing
      ? [lastScreenIndex, halfWay, currentScreenIndex]
      : [currentScreenIndex, halfWay, lastScreenIndex];

    // Output range depends on if this is the screen fading in or fading out, and in which direction
    // the input range was ordered
    let outputRange;
    if (isCurrentScreen) {
      outputRange = isIncreasing ? [0, 0, 1] : [1, 0, 0];
    } else {
      outputRange = isIncreasing ? [1, 0, 0] : [0, 0, 1];
    }

    const isTransitioningIn = isCurrentScreen && this.state.lastScreenIndex !== null;
    return {
      opacity: this.state.screenIndexAnimation.interpolate({ inputRange, outputRange }),
      position: isTransitioningIn ? 'absolute' : 'relative',
      left: 0,
      right: 0,
      flex: 1,
    };
  }

  render() {
    const {
      errorMessage,
      onPressPrevious,
      onPressNext,
      onPressRepeat,
      onPressSubmit,
      screenProps,
      surveyName,
      surveyProgress,
      isSubmitting,
      surveyScreens,
      screenIndex,
    } = this.props;
    const { BackgroundComponent } = screenProps;
    const { isTableOfContentsVisible } = this.state;
    return (
      <BackgroundComponent style={localStyles.container}>
        {[0, 1].map((index) => {
          // Even screens will use the first component, odd will use the second
          const isCurrentContent = screenIndex % 2 === index;
          const screenIndexForThisContent = isCurrentContent
            ? screenIndex
            : this.state.lastScreenIndex;
          if (screenIndexForThisContent === null) {
            return null;
          }
          return (
            <Animated.View
              key={screenIndexForThisContent}
              style={this.getStyleForContent(screenIndexForThisContent)}
            >
              {isCurrentContent && !!errorMessage && (
              <StatusMessage
                type={STATUS_MESSAGE_ERROR}
                message={errorMessage}
              />
              )}
              <ScrollView
                ref={(scrollViewRef) => {
                  this.scrollViewRefs[index] = scrollViewRef;
                }}
                style={localStyles.scrollView}
              >
                {screenIndexForThisContent === surveyScreens.length
                  ? <SubmitScreen />
                  : <QuestionScreen screenIndex={screenIndexForThisContent} />
                }
                {isSubmitting && <ActivityIndicator color={THEME_COLOR_ONE} size="large" />}
                <View style={localStyles.buttonContainerContainer}>
                  {isCurrentContent && onPressSubmit !== null && !isSubmitting && (
                  <Button
                    title="Submit"
                    onPress={onPressSubmit}
                    style={localStyles.submitButton}
                  />
                  )}
                  {isCurrentContent && onPressRepeat !== null && !isSubmitting && (
                  <Button
                    title="Submit and repeat"
                    onPress={onPressRepeat}
                    style={localStyles.submitButton}
                  />
                  )}
                </View>
              </ScrollView>
            </Animated.View>
          );
        })}
        <ProgressActionBar
          progress={surveyProgress}
          label={surveyName}
          style={localStyles.actionBar}
          onPressNext={onPressNext}
          onPressPrevious={onPressPrevious}
          isPreviousEnabled={onPressPrevious !== null && !isSubmitting}
          isNextEnabled={onPressNext !== null && !isSubmitting}
          isTableOfContentsEnabled={!isSubmitting}
          onPressToc={() => this.onToggleToc()}
        />
        <Popup
          visible={isTableOfContentsVisible}
          onDismiss={() => this.onToggleToc()}
          title={surveyName}
        >
          <SurveyTableOfContents
            screens={surveyScreens}
            onSelectScreen={(selectedScreenIndex) => this.onSelectScreen(selectedScreenIndex)}
            activeScreenIndex={screenIndex}
          />
        </Popup>
        <KeyboardSpacer />
      </BackgroundComponent>
    );
  }
}

DumbSurveyScreen.propTypes = {
  onPressPrevious: PropTypes.func,
  onPressNext: PropTypes.func,
  onPressSubmit: PropTypes.func,
  onPressRepeat: PropTypes.func,
  onSelectSurveyScreen: PropTypes.func,
  screenProps: PropTypes.object.isRequired,
  surveyName: PropTypes.string.isRequired,
  surveyProgress: PropTypes.number.isRequired,
  isSubmitting: PropTypes.bool,
  surveyScreens: PropTypes.array.isRequired,
  screenIndex: PropTypes.number.isRequired,
};

DumbSurveyScreen.defaultProps = {
  onPressPrevious: null,
  onPressNext: null,
  onPressSubmit: null,
  onPressRepeat: null,
  isSubmitting: false,
  onSelectSurveyScreen: null,
};

const ACTION_BAR_HEIGHT = 80;

const localStyles = StyleSheet.create({
  buttonContainerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginVertical: 40,
  },
  submitButton: {
    margin: 5,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  actionBar: {
    position: 'relative',
    height: ACTION_BAR_HEIGHT,
  },
});
