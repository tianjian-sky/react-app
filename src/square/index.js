import React from 'react';

export class Square extends React.Component {
    constructor(props) {
        super(props);
        console.warn(props)
    }
    render() {
        return (
        <button 
            className="square"  
            onClick={() => this.props.onClick()}
        >
            {this.props.value}
        </button>
        );
    }
}