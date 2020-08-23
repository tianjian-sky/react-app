import React from 'react';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '1-1',
        }
    }
    draw() {
        let c = this.refs.canvas
        // let c2d = c.getContext('2d')
        // c2d.fillStyle = 'rgba(0,0,255,1.0)'
        // c2d.fillRect(120,10,150,150)
        let gl = c.getContext('webgl')
        gl.clearColor(0,0,0,1)
        gl.clear(gl.COLOR_BUFFER_BIT)
    }
    componentDidMount() {
        this.draw()
    }

    render() {
        return (
            <div id="1-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <canvas className="webgl" width="400" height="400" ref="canvas" ></canvas>
            </div>
        );
    }
}