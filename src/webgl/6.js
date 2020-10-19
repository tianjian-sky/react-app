import React from 'react';
import _5_7 from './5/7' 
import _6_1 from './6/1' 

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
                </div>
            </div>
        );
    }
}