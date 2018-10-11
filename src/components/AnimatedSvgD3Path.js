// @flow
/**
 * Problem: What is the best way to animate a path with animated.value?
 * Solution: This demonstrates how you can do it with d3-path
 */

import React, { Component } from 'react';
import { Svg } from 'expo';
import { Animated } from 'react-native';
import * as d3 from 'd3-path';

import AnimatedSvgFix from './AnimatedSvgFix';
import D3PathCommand from './D3PathCommand';

type Step = {
    command: string
};

export const argsForCommand = {
    moveTo: ['x', 'y'],
    closePath: [],
    lineTo: ['x', 'y'],
    quadraticCurveTo: ['cpx', 'cpy', 'x', 'y'],
    bezierCurveTo: ['cpx1', 'cpy1', 'cpx2', 'cpy2', 'x', 'y'],
    arcTo: ['x1', 'y1', 'x2', 'y2', 'radius'],
    arc: ['x', 'y', 'radius', 'startAngle', 'endAngle', 'anticlockwise'],
    rect: ['x', 'y', 'w', 'h']
};

const NativeSvgPath = Svg.Path;

function createPathFromSteps(steps: Step[]): string {
    let path = d3.path();
    steps.forEach(step => {
        let args = argsForCommand[step.command];
        args = args.map(key => step[key]);
        path[step.command](...args);
    });
    return path.toString();
}

class SvgD3Path extends Component {
    listeners: any[];
    steps: Step[];
    constructor(props) {
        super(props);
        this.listeners = [];
        this.steps = [];
        this.listenToChildren(props);
    }
    setNativeProps = (props = {}) => {
        if (props.updateD3Path) {
            props.d = createPathFromSteps(this.steps);
        }
        this._component && this._component.setNativeProps(props);
    };
    // immutable update step arg value
    updateStep = (stepIndex, arg, value) => {
        const oldStep = this.steps[stepIndex];
        const newStep = {
            ...oldStep,
            [arg]: value
        };
        let newSteps = [...this.steps];
        newSteps[stepIndex] = newStep;
        return newSteps;
    };
    addListenerForAnimatedArgProp = (prop, arg, stepIndex) => {
        const addListener = prop._parent
            ? prop._parent.addListener.bind(prop._parent)
            : prop.addListener.bind(prop);
        const interpolator = prop._interpolation;
        let callback = e => e;
        if (interpolator) {
            callback = _value => interpolator(_value);
        }
        let prevCallback = callback;
        callback = e => {
            const value = prevCallback(e.value);
            this.steps = this.updateStep(stepIndex, arg, value);
            this.setNativeProps({ updateD3Path: true });
        };
        return addListener(callback);
    };
    listenToChildren = ({ children }) => {
        this.steps = [];
        let stepIndex = 0;
        React.Children.forEach(children, (child, i) => {
            if (child) {
                if (child.type === D3PathCommand) {
                    let step = {};
                    step.command = child.props.command;
                    const args = argsForCommand[child.props.command];
                    args.forEach(arg => {
                        const prop = child.props[arg];
                        if (
                            prop instanceof Animated.Value ||
                            prop instanceof Animated.Interpolation
                        ) {
                            step[arg] = prop.__getValue();
                            const listener = this.addListenerForAnimatedArgProp(
                                prop,
                                arg,
                                stepIndex
                            );
                            this.listeners.push({ id: listener, object: prop });
                        } else {
                            step[arg] = prop;
                        }
                    });
                    this.steps[stepIndex] = step;
                    stepIndex += 1;
                }
            }
        });
    };
    removeAllListeners = () => {
        this.listeners.forEach(({ id, object }) => {
            if (object._parent) {
                object._parent.removeListener(id);
            } else {
                object.removeListener(id);
            }
        });
    };
    shouldComponentUpdate(nextProps) {
        if (nextProps.children !== this.props.children) {
            this.removeAllListeners();
            this.listeners = [];
            this.listenToChildren(nextProps);
            return true;
        }
        return false;
    }
    componentWillUnmount() {
        this.removeAllListeners();
    }
    render() {
        const { children, ...props } = this.props; // eslint-disable-line no-unused-vars
        const d = createPathFromSteps(this.steps);
        return (
            <NativeSvgPath
                ref={component => (this._component = component)}
                {...props}
                d={d}
            />
        );
    }
}
SvgD3Path = AnimatedSvgFix(SvgD3Path);
export default SvgD3Path;
