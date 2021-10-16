import React from 'react';
import _8_1 from './8/1'
import _8_2 from './8/2'

export default class extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ch3">
                <div className="webgl contaner">
                    <_8_1 />
                    <_8_2 />
                </div>
            </div>
        );
    }
}