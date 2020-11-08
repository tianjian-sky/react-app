import React from 'react'; 
import _7_1 from './7/1' 
import _7_2 from './7/2' 
import _7_3 from './7/3' 
import _7_4 from './7/4'
import _7_5 from './7/5'
import _7_6 from './7/6'
import _7_7 from './7/7'
import _7_8 from './7/8'
import _7_9 from './7/9'
import _7_10 from './7/10'

export default class extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ch3">
                <div className="webgl contaner">
                    <_7_1/>
                    <_7_2/>
                    <_7_3/>
                    <_7_4/>
                    <_7_5/>
                    <_7_6/>
                    <_7_7/>
                    <_7_8/>
                    <_7_9/>
                    <_7_10/>
                </div>
            </div>
        );
    }
}