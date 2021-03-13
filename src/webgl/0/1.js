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
        const [c1,c2,c3, c12,c13] = [document.getElementById("c1"),document.getElementById("c2"),document.getElementById("c3"),document.getElementById("c12"), document.getElementById("c13")]
        const [ctx1,ctx2,ctx3, ctx12, ctx13] = [c1.getContext("2d"),c2.getContext("2d"),c3.getContext("2d"),c12.getContext('2d'), c13.getContext('2d')]
        var img = new Image()
        img.src = pic
        img.onload = function () {
            ctx1.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
            ctx1.fillRect(0,0,c1.width, c1.height)
            // 2x 屏幕
            // 高清屏要想无损显示原图，必须准备2x，3x原始尺寸的图片,
            // 且canvas必须设置为缩放模式，在img标签可以通过缩放显示为高清，canvas里仅仅将图片缩放不能实现高清
            ctx12.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
            ctx12.fillRect(0,0,c12.width, c12.height)
            ctx13.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
            ctx13.fillRect(0,0,c13.width, c13.height)
            ctx2.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
            ctx2.fillRect(0,0,c2.width, c2.height)
            ctx3.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
            ctx3.fillRect(0,0,c3.width, c3.height)
            ctx1.drawImage(img,10,10); // 偏移
            ctx12.drawImage(img,10,10); // 偏移
            ctx13.drawImage(img,10,10,.5*img.width,.5*img.height); // 偏移 + 0.5缩放
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
                <img src={pic} alt="原图"></img><br/>
                <img src={pic} alt="原图" width="128" height="128"></img>
                <p>偏移</p>
                <canvas id="c1" className="webgl" width="300" height="200" ref="canvas" ></canvas>
                <p>2x屏幕偏移，整体缩放</p>
                <canvas id="c12" className="webgl" width="600" height="400" ref="canvas" style={{width: '300px', height: '200px'}}></canvas>
                <p>2x屏幕偏移，图片缩放</p>
                <canvas id="c13" className="webgl" width="300" height="200" ref="canvas" style={{width: '300px', height: '200px'}}></canvas>
                <p>偏移+缩放</p>
                <canvas id="c2" className="webgl" width="300" height="200" ref="canvas" ></canvas>
                <p>偏移+裁剪+缩放</p>
                <canvas id="c3" className="webgl" width="300" height="200" ref="canvas" ></canvas>
            </div>
        );
    }
}