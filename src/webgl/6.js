import React from 'react';
import _5_7 from './5/7' 
import _6_1 from './6/1' 
import _6_2 from './6/2' 
import _6_3 from './6/3'
import _6_4 from './6/4'
import _6_5 from './6/5'

export default class extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ch3">
                <div className="webgl contaner">
                    <_5_7/>
                    <_6_1/>
                    <_6_2/>
                    <_6_3/>
                    <_6_4/>
                    <_6_5/>
                </div>
            </div>
        );
    }
}