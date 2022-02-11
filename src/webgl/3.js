import React from 'react';
import _3_1 from './3/1'
import _3_2 from './3/2'
import _3_3 from './3/3'

export default class extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className="ch3">
                <div className="webgl contaner">
                    <_3_1 />
                    <_3_2 />
                    <_3_3 />
                </div>
            </div>
        );
    }
}