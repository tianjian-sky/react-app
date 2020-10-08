import React from 'react';
import _5_1 from './5/1' 
import _5_2 from './5/2'

export default class extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ch3">
                <div className="webgl contaner">
                    <_5_1/>
                    <_5_2/>
                </div>
            </div>
        );
    }
}