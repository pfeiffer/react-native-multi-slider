'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  PropTypes
} = React;
var {
  StyleSheet,
  PanResponder,
  View,
  TouchableHighlight
} = ReactNative;

var converter = require('./converter.js');
var mockProps = require('./mockProps.js');



var sliderProps = {
  values: PropTypes.arrayOf(PropTypes.number),

  onValuesChangeStart: PropTypes.func,
  onValuesChange: PropTypes.func,
  onValuesChangeFinish: PropTypes.func,

  sliderLength: PropTypes.number,
  sliderOrientation: PropTypes.string,
  touchDimensions: PropTypes.object,

  customMarker: PropTypes.func,

  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,

  optionsArray: PropTypes.array,

  containerStyle: View.propTypes.style,
  trackStyle: View.propTypes.style,
  selectedStyle: View.propTypes.style,
  unselectedStyle: View.propTypes.style,
  markerStyle: View.propTypes.style,
  pressedMarkerStyle: View.propTypes.style
};

var Slider = React.createClass({

  propTypes: sliderProps,

  getDefaultProps: function() {
    return mockProps;
  },

  getInitialState() {
    this.optionsArray = this.props.optionsArray || converter.createArray(this.props.min,this.props.max,this.props.step);
    this.stepLength = this.props.sliderLength/this.optionsArray.length;

    var initialValues = this.props.values.map(value => converter.valueToPosition(value,this.optionsArray,this.props.sliderLength));

    return {
      pressedOne: true,
      valueOne: this.props.values[0],
      valueTwo: this.props.values[1],
      pastOne: initialValues[0],
      pastTwo: initialValues[1],
      positionOne: initialValues[0],
      positionTwo: initialValues[1]
    };
  },

  componentWillMount() {
    var customPanResponder = function (start,move,end) {
      return PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => true,
        onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => true,
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
        onPanResponderGrant: (evt, gestureState) => start(),
        onPanResponderMove: (evt, gestureState) => move(gestureState),
        onPanResponderTerminationRequest: (evt, gestureState) => true,
        onPanResponderRelease: (evt, gestureState) => end(gestureState),
        onPanResponderTerminate: (evt, gestureState) => end(gestureState),
        onShouldBlockNativeResponder: (evt, gestureState) => true
      })
    };

    this._panResponderOne = customPanResponder(this.startOne, this.moveOne, this.endOne);
    this._panResponderTwo = customPanResponder(this.startTwo, this.moveTwo, this.endTwo);

  },

  componentWillReceiveProps(nextProps) {
    var { values } = this.props;
    if (nextProps.values.join() !== values.join()) {
      this.set(nextProps);
    }
  },

  set(config) {
    var { max, min, optionsArray, step, values } = config || this.props;
    this.optionsArray = optionsArray || converter.createArray(min, max, step);
    this.stepLength = this.props.sliderLength/this.optionsArray.length;

    var initialValues = values.map(value => converter.valueToPosition(value,this.optionsArray,this.props.sliderLength));

    this.setState({
      pressedOne: true,
      valueOne: values[0],
      valueTwo: values[1],
      pastOne: initialValues[0],
      pastTwo: initialValues[1],
      positionOne: initialValues[0],
      positionTwo: initialValues[1]
    });
  },

  startOne () {
    this.props.onValuesChangeStart();
    this.setState({
      onePressed: !this.state.onePressed
    });
  },

  startTwo () {
    this.props.onValuesChangeStart();
    this.setState({
      twoPressed: !this.state.twoPressed
    });
  },

  moveOne(gestureState) {
    var unconfined = gestureState.dx + this.state.pastOne;
    var bottom     = 0;
    var top        = (this.state.positionTwo - this.stepLength) || this.props.sliderLength;
    var confined   = unconfined < bottom ? bottom : (unconfined > top ? top : unconfined);
    var value      = converter.positionToValue(this.state.positionOne, this.optionsArray, this.props.sliderLength);

    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (Math.abs(gestureState.dy) < slipDisplacement || !slipDisplacement) {
      this.setState({
        positionOne: confined
      });
    }
    if ( value !== this.state.valueOne ) {
      this.setState({
        valueOne: value
      }, function () {
        var change = [this.state.valueOne];
        if (this.state.valueTwo) {
          change.push(this.state.valueTwo);
        }
        this.props.onValuesChange(change);
      });
    }
  },

  moveTwo(gestureState) {
    var unconfined  = gestureState.dx + this.state.pastTwo;
    var bottom      = this.state.positionOne + this.stepLength;
    var top         = this.props.sliderLength;
    var confined    = unconfined < bottom ? bottom : (unconfined > top ? top : unconfined);
    var value       = converter.positionToValue(this.state.positionTwo, this.optionsArray, this.props.sliderLength);
    var slipDisplacement = this.props.touchDimensions.slipDisplacement;

    if (Math.abs(gestureState.dy) < slipDisplacement || !slipDisplacement) {
      this.setState({
        positionTwo: confined
      });
    }
    if ( value !== this.state.valueTwo ) {
      this.setState({
        valueTwo: value
      }, function () {
        this.props.onValuesChange([this.state.valueOne,this.state.valueTwo]);
      });
    }
  },

  endOne(gestureState) {
    this.setState({
      pastOne: this.state.positionOne,
      onePressed: !this.state.onePressed
    }, function () {
      var change = [this.state.valueOne];
      if (this.state.valueTwo) {
        change.push(this.state.valueTwo);
      }
      this.props.onValuesChangeFinish(change);
    });
  },

  endTwo(gestureState) {
    this.setState({
      twoPressed: !this.state.twoPressed,
      pastTwo: this.state.positionTwo,
    }, function () {
      this.props.onValuesChangeFinish([this.state.valueOne,this.state.valueTwo]);
    });
  },

  render() {

    var {positionOne, positionTwo} = this.state;
    var {selectedStyle, unselectedStyle, sliderLength, markerSize} = this.props;
    var twoMarkers = positionTwo;

    var trackOneLength = positionOne;
    var trackOneStyle = twoMarkers ? unselectedStyle : selectedStyle;
    var trackThreeLength = twoMarkers ? sliderLength - (positionTwo) : 0;
    var trackThreeStyle = unselectedStyle;
    var trackTwoLength = sliderLength - trackOneLength - trackThreeLength;
    var trackTwoStyle = twoMarkers ? selectedStyle : unselectedStyle;
    var Marker = this.props.customMarker;
    var {slipDisplacement, height, width, borderRadius} = this.props.touchDimensions;
    var touchStyle = {
      height: height,
      width: width,
      left: -width/2,
      borderRadius: borderRadius || 0
    };

    var markerStyle = {
      width: markerSize,
      height: markerSize,
    };

    var trackStyle = {
      marginTop: markerSize / 2,
    };

    return (
      <View style={[styles.container, this.props.containerStyle]}>
        <View style={[styles.fullTrack, {width: sliderLength }]}>
          <View style={[this.props.trackStyle, trackStyle, styles.track, trackOneStyle, { width: trackOneLength }]} />

          <View
            style={[styles.touch, touchStyle, { left: trackOneLength }]}
            ref={component => this._markerOne = component}
            {...this._panResponderOne.panHandlers}
          >
            <Marker
              pressed={this.state.onePressed}
              markerStyle={[markerStyle, this.props.markerStyle]}
              pressedMarkerStyle={this.props.pressedMarkerStyle}
            />
          </View>

          <View style={[this.props.trackStyle, trackStyle, styles.track, trackTwoStyle, { width: trackTwoLength }]} />

          {twoMarkers && (positionOne !== this.props.sliderLength) && (
            <View
              style={[styles.touch, touchStyle, { left: trackOneLength + trackTwoLength - markerSize }]}
              ref={component => this._markerTwo = component}
              {...this._panResponderTwo.panHandlers}
            >
              <Marker
                pressed={this.state.twoPressed}
                markerStyle={[markerStyle, this.props.markerStyle]}
                pressedMarkerStyle={this.props.pressedMarkerStyle}
              />
            </View>
          )}
          <View style={[this.props.trackStyle, trackStyle, styles.track, trackThreeStyle, { width: trackThreeLength }]} />
        </View>
      </View>
    );
  }
});

module.exports = Slider;

var styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  fullTrack: {
    flex: 1,
    flexDirection: 'row',
  },
  touch: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    top: 0,
    zIndex: 1,
  }
});
