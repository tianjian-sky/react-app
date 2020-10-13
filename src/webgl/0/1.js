import React from 'react';
import pic from '../../static/pinkflower.jpg';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '0-1 canvas drawImage',
        }
    }
    draw() {
        const [c1,c2,c3] = [document.getElementById("c1"),document.getElementById("c2"),document.getElementById("c3")]
        const [ctx1,ctx2,ctx3] = [c1.getContext("2d"),c2.getContext("2d"),c3.getContext("2d")]
        var img = new Image()
        img.src = pic
        img.onload = function () {
            ctx1.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
            ctx1.fillRect(0,0,c1.width, c1.height)
            ctx2.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
            ctx2.fillRect(0,0,c2.width, c2.height)
            ctx3.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
            ctx3.fillRect(0,0,c3.width, c3.height)
            ctx1.drawImage(img,10,10); // 偏移
            ctx2.drawImage(img,10,10, 150, 100); // 缩放
            ctx3.drawImage(img,30, 30, 100, 100, 10,10, 50, 30); // 偏移+裁剪+缩放
        }

    }
    componentDidMount() {
        this.draw()
    }

    render() {
        return (
            <div id="1-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>原图</p>
                <img src={pic} alt="原图"></img>
                <p>偏移</p>
                <canvas id="c1" className="webgl" width="300" height="200" ref="canvas" ></canvas>
                <p>偏移+缩放</p>
                <canvas id="c2" className="webgl" width="300" height="200" ref="canvas" ></canvas>
                <p>偏移+裁剪+缩放</p>
                <canvas id="c3" className="webgl" width="300" height="200" ref="canvas" ></canvas>
            </div>
        );
    }
}