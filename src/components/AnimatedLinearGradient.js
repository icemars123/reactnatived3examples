import React, { Component } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import Expo from 'expo';
const { LinearGradient: NativeLinearGradient } = Expo;

/**
 * Problem: LinearGradient requires an array for colors but animated values cannot
 * Solution: Map through all prop keys following pattern color0, color1, color2, ...
 */
class LinearGradient extends Component {
    static defaultProps = {
        start: [0, 0.4],
        end: [1, 0.6]
    }
    render() {
        const colors = Object.keys(this.props)
            .filter(key => key.includes('color'))
            .map((propKey, i) => this.props[propKey]);
        return (
            <NativeLinearGradient
                colors={colors}
                style={[StyleSheet.absoluteFill, this.props.style]}
            />
        );
    }
}
Animated.LinearGradient = Animated.createAnimatedComponent(LinearGradient);

class AnimatedGradient extends Component {

    state = {
        animatedColors: this.props.colors.map(color => new Animated.Value(0))
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.colors !== this.props.colors) {
            this.interpolatedColors = this.interpolateColors(nextProps);
            this.state.animatedColors.forEach(animatedColor => animatedColor.setValue(0));
            Animated.parallel(
                this.state.animatedColors.map(animatedColor => {
                    return Animated.timing(animatedColor, {
                        toValue: 1,
                        duration: this.props.speed,
                        easing: Easing.linear
                    });
                })
            ).start();
        }
    }

    interpolateColors = ({ colors }) => {
        return this.state.animatedColors.map((animatedColor, i) => {
            return animatedColor.interpolate({
                inputRange: [0, 1],
                outputRange: [
                    this.props.colors[i],
                    colors[i] || 'transparent'
                ]
            });
        });
    }

    interpolatedColors = this.interpolateColors(this.props)

    render() {
        const { style, colors, ...props } = this.props; // eslint-disable-line no-unused-vars
        const colorProps = this.interpolatedColors.reduce((obj, interpolatedColor, i) => {
            obj['color' + i] = interpolatedColor;
            return obj;
        }, {});
        return (
            <Animated.LinearGradient
                {...props}
                {...colorProps}
                style={[StyleSheet.absoluteFill, style]}
            />
        );
    }
}

export default AnimatedGradient;
