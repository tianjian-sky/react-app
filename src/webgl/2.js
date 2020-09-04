import React from 'react';
import _2_1 from './2/1' 
import _2_2 from './2/2'
import _2_3 from './2/3'
import _2_4 from './2/4'
import _2_5 from './2/5'

export default class extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ch2">
                <div className="webgl contaner">
                    <_2_1></_2_1>
                    <_2_2/>
                    <_2_3/>
                    <_2_4/>
                    <_2_5/>
                </div>
            </div>
        );
    }
}