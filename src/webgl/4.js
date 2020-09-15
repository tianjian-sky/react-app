import React from 'react';
import _4_1 from './4/1' 
import _4_2 from './4/2'

export default class extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ch3">
                <div className="webgl contaner">
                    <_4_1/>
                    <_4_2/>
                </div>
            </div>
        );
    }
}