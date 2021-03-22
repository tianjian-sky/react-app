import React from 'react';
import pic from '../../static/pinkflower.jpg';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '0-1 canvas offscreen render, worker',
        }
    }
    draw() {
        const [c1,c2] = [document.getElementById("co1"),document.getElementById("co2")]
        const [ctx1] = [c1.getContext("2d")]
        const offscreenCanvas = c2.transferControlToOffscreen()
        var img = new Image()
        
        img.src = pic
        img.onload = () => {
            setInterval(() => {
                this.frameImg(ctx1, img)
            }, 100)
            // const ctx2 = c2.getContext('2d') //  Cannot get context from a canvas that has transferred its control to offscreen.
            const imgBItmap = createImageBitmap(img).then(res => {
                console.log('img bitmap', res)
                let worker = new Worker('/render.worker.js')
                worker.postMessage({
                    drawSurface: offscreenCanvas,
                    img: res // 往worker里不能直接传img。
                }, [offscreenCanvas]) // OffscreenCanvas could not be cloned because it was not transferred.
            })
        }
    }
    componentDidMount() {
        this.draw()
    }
    frameImg (ctx, img){
        ctx.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
        ctx.fillRect(0,0,ctx.width, ctx.height)
        ctx.drawImage(img,Math.random() * 100, Math.random() * 100)
    }

    render() {
        return (
            <div id="1-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>原图</p>
                <img src={pic} alt="原图"></img><br/>
                <img src={pic} alt="原图" width="128" height="128"></img>
                <p>main thread:</p>
                <canvas id="co1" className="webgl" width="600" height="400" ref="canvas" style={{width: '300px', height: '200px'}}></canvas>
                <p>worker thread:</p>
                <canvas id="co2" className="webgl" width="600" height="400" ref="canvas" style={{width: '300px', height: '200px'}}></canvas>
            </div>
        );
    }
}