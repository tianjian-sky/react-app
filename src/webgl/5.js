import React from 'react';
import _5_1 from './5/1' 
import _5_2 from './5/2'
import _5_3 from './5/3'
import _5_4 from './5/4'
import _5_5 from './5/5'
import _5_6 from './5/6'
import _5_7 from './5/7'

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
                    <_5_3/>
                    <_5_4/>
                    <_5_5/>
                    <_5_6/>
                    <_5_7/>
                </div>
            </div>
        );
    }
}