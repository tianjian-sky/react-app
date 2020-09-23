import React from 'react';
import _4_1 from './4/1' 
import _4_2 from './4/2'
import _4_3 from './4/3'
import _4_4 from './4/4'
import _4_5 from './4/5'

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
                    <_4_3/>
                    <_4_4/>
                    <_4_5/>
                </div>
            </div>
        );
    }
}