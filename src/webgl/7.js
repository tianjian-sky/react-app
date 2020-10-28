import React from 'react'; 
import _7_1 from './7/1' 
import _7_2 from './7/2' 
import _7_3 from './7/3' 
import _7_4 from './7/4'


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
                </div>
            </div>
        );
    }
}