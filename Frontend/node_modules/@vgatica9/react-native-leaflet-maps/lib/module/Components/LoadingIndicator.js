import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
const LoadingIndicator = () => {
  return /*#__PURE__*/React.createElement(View, {
    style: styles.activityOverlayStyle
  }, /*#__PURE__*/React.createElement(View, {
    style: styles.activityIndicatorContainer
  }, /*#__PURE__*/React.createElement(ActivityIndicator, {
    size: "large"
  })));
};
const styles = StyleSheet.create({
  activityOverlayStyle: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, .5)',
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    borderRadius: 5
  },
  activityIndicatorContainer: {
    backgroundColor: 'lightgray',
    padding: 10,
    borderRadius: 50,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowRadius: 5,
    shadowOpacity: 1.0
  }
});
export default LoadingIndicator;
//# sourceMappingURL=LoadingIndicator.js.map