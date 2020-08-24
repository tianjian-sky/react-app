import React from 'react';
import _1_1 from './1/1' 
import _1_2_shader from './1/2'

export default class extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ch2">
                <div className="webgl contaner">
                    <_1_1></_1_1>
                </div>
                <div className="webgl_contaner">
                    <_1_2_shader></_1_2_shader>
                </div>
            </div>
        );
    }
}