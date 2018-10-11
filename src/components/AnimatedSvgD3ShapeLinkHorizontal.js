// @flow
import React, { Component } from 'react';
import { Animated } from 'react-native';
import * as d3 from 'd3-shape';
import omit from 'lodash/omit';

import Path from './AnimatedSvgPath';
import { listen, removeListeners } from '../animatedListener';
import type { AnimatedListener } from '../animatedListener';

type Link = d3.Link;

export const args = ['x', 'y'];

function createGenerator(props, generator?: Link): Link {
    generator = generator || d3.linkHorizontal();
    return args.reduce((acc: Link, arg) => {
        const prop = props[arg];
        if (prop) {
            return acc[arg](prop);
        }
        return acc;
    }, generator);
}

function createPath(generator: Link, data): string {
    return generator(data);
}

class SvgD3ShapeLinkHorizontal extends Component {
    generator: Link;
    data: {
        source: AnimatedListener,
        target: AnimatedListener
    };
    constructor(props) {
        super(props);
        this.generator = createGenerator(props);
        this.data = {
            source: listen(props.source, _ => this.setNativeProps({ _listener: true })),
            target: listen(props.target, _ => this.setNativeProps({ _listener: true }))
        };
    }
    setNativeProps = (props = {}) => {
        const argChanged = args.some((key, index) => props[key] != null);
        if (argChanged) {
            this.generator = createGenerator(props, this.generator);
        }
        if (argChanged || props.source || props.target || props._listener) {
            props.d = createPath(this.generator, {
                source: props.source || this.data.source.values,
                target: props.target || this.data.target.values
            });
        }
        this._component && this._component.setNativeProps(props);
    }
    shouldComponentUpdate(nextProps) {
        const argChanged = args.some((key, index) => nextProps[key] !== this.props[key]);
        const sourceChanged = nextProps.source !== this.props.source;
        const targetChanged = nextProps.target !== this.props.target;
        if (argChanged) {
            this.generator = createGenerator(nextProps, this.generator);
        }
        if (sourceChanged) {
            removeListeners(this.data.source);
            this.data.source = listen(nextProps.source, _ => this.setNativeProps({ _listener: true }));
        }
        if (targetChanged) {
            removeListeners(this.data.target);
            this.data.target = listen(nextProps.target, _ => this.setNativeProps({ _listener: true }));
        }
        return argChanged || sourceChanged || targetChanged;
    }
    componentWillUnmount() {
        removeListeners(this.data.source);
        removeListeners(this.data.target);
    }
    render() {
        const filteredProps = omit(this.props, args);
        const d = createPath(this.generator, {
            source: this.data.source.values,
            target: this.data.target.values
        });
        return (
            <Path
                ref={component => (this._component = component)}
                {...filteredProps}
                d={d}
            />
        );
    }
}
SvgD3ShapeLinkHorizontal = Animated.createAnimatedComponent(SvgD3ShapeLinkHorizontal);
export default SvgD3ShapeLinkHorizontal;
