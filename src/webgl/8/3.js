import React from 'react';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '8-3 canvas width, dpr, viewport',
            gl: null,
            points: [],
            eyeAt: {
                x: 0,
                y: 0,
                z: 0
            },
            viewport: {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            },
            canvasBase: {
                width: 400,
                height: 400
            },
            canvasStyle: {
                width: 400,
                height: 400
            },
            canvas: {
                width: 400,
                height: 400,
                updateStyle: false
            },
            dpr: 1,
            count: 3,
        }
    }
    draw() {
        let c = this.refs.canvas
        let gl = c.getContext('webgl2')
        this.state.gl = gl
        this.initVp(gl)
        // 顶点着色器
        const VSHADER_SOURCE = `
            // #version 330 core
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            attribute vec4 a_Offset;
            varying vec2 instanceTransform0;
            varying vec2 instanceTransform1;
            // layout(location=2) in vec4 a_Offset;
            // uniform mat4 u_ViewMatrix;
            varying vec4 v_Color;
            void main(){
                gl_Position = a_Position + a_Offset;
                v_Color = a_Color;
            }
        `

        //片元着色器
        const FSHADER_SOURCE = `
            precision mediump float;
            varying vec4 v_Color;
            void main () {
                gl_FragColor = v_Color;
            }
        `

        // 创建一个 WebGL 着色器程序
        const program = gl.createProgram();
        const vshader = this.loadShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE)
        const fshader = this.loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE)

        let offsetArray = []
        for (var i = 0; i < this.state.count; i++) {
            for (var j = 0; j < this.state.count; j++) {
                var x = ((i + 1) - this.state.count / 2) / this.state.count * 4 - 2 / this.state.count;
                var y = ((j + 1) - this.state.count / 2) / this.state.count * 4 - 2 / this.state.count;
                var z = 0;
                offsetArray.push(x, y, z)
            }
        }
        offsetArray = new Float32Array(offsetArray)

        // 一个 WebGLProgram 对象由两个编译过后的 WebGLShader 组成 - 顶点着色器和片段着色器（均由 GLSL 语言所写）。这些组合成一个可用的 WebGL 着色器程序。
        gl.attachShader(program, vshader);
        gl.attachShader(program, fshader);

        gl.linkProgram(program);

        const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES); // link 后可以打印出Active attributes
        for (let i = 0; i < numAttribs; ++i) {
            const info = gl.getActiveAttrib(program, i);
            console.log('getProgramParameter:', info.name, 'type:', info.type, 'size:', info.size);
        }

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw "Could not compile WebGL program. \n\n" + info;
        }
        gl.useProgram(program); // 一定要在变量赋值以前
        gl.program = program;

        // {
        //     gl.VAOArray = gl.createVertexArray();        //创建VAO数组对象
        //     gl.bindVertexArray(gl.VAOArray);
        // }
        // 设置顶点
        let verticesColors = new Float32Array([
            0.0, .5, -.4, .4, 1, .4,
            -.5, -.5, -.4, .4, 1, .4,
            .5, -.5, -.4, 1, .4, .4,
        ])
        let indices = new Uint8Array([
            0, 1, 2
        ])

        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
        const FSIZE = verticesColors.BYTES_PER_ELEMENT // TypedArray.BYTES_PER_ELEMENT 属性代表了强类型数组中每个元素所占用的字节数。
        const STEP = FSIZE * 6
        const n = 3
        gl.n = n
        gl.indicesLenth = indices.length

        let vertixBuffer = gl.createBuffer() // 缓冲区对象

        if (!vertixBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }
        let a_Position = gl.getAttribLocation(program, 'a_Position')
        let a_Color = gl.getAttribLocation(program, 'a_Color')
        let a_Offset = gl.getAttribLocation(program, 'a_Offset')
        if (a_Position < 0 || a_Color < 0) {
            console.log('Failed to get the storage location of a_position')
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer) // 将给定的WebGLBuffer绑定到目标。ARRAY_BUFFER，ELEMENT_ARRAY_BUFFER，UNIFORM_BUFFER。。
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW) // 创建并初始化了Buffer对象的数据存储区。
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STEP, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Position) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, STEP, FSIZE * 3) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Color)

        let offsetBuffer = gl.createBuffer() // 缓冲区对象
        gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, offsetArray, gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Offset, 3, gl.FLOAT, false, FSIZE * 3, 0); // 定义每个数据的长度为3个分量，长度为12 = 3 * 4（浮点数长度）。
        gl.enableVertexAttribArray(a_Offset); // 启用偏移量attribute变量从缓冲区取数据


        {
            gl.vertexAttribDivisor(a_Offset, 1); // 指定缓冲区中的每一个值，用于多少个对象，比如divisor = 1，表示每一个值用于一个对象；如果divisor=2，表示一个值用于两个对象。 index表示的attribute变量的地址。
            // gl.bindVertexArray(null)
        }
        this.rePaint(gl)
    }
    rePaint(gl) {
        // let viewMatrix = new cuon.Matrix4()
        // viewMatrix.setLookAt(this.state.eyeAt.x, this.state.eyeAt.y, this.state.eyeAt.z, 0, 0, 1, 0, 1, 0) // 视点(.2,.25,.25) 观察点（0，0，0）上方向（0，1，0）

        // let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix')
        // gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements)
        // if (u_ViewMatrix < 0) {
        //     console.log('Failed to get the storage location of a_position')
        // }

        gl.clearColor(0, 0.222, .333, 1)
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
        // 非instance
        {
            // 方法1: gl.drawElements
            {
                // gl.drawElements(gl.TRIANGLES, gl.n, gl.UNSIGNED_BYTE, 0)
            }
            // 方法2: gl.drawArraysInstanced
            {
                // gl.drawArrays(gl.TRIANGLES, 0, gl.n)
            }
        }
        // instance
        {
            // 方法1: gl.drawArraysInstanced
            {
                gl.drawArraysInstanced(gl.TRIANGLES, 0, gl.indicesLenth, this.state.count * this.state.count);
            }
            // 方法2: gl.drawElementsInstanced
            {
                // gl.drawElementsInstanced(gl.TRIANGLES, gl.indicesLenth, gl.UNSIGNED_BYTE, 0, this.state.count * this.state.count);
            }
        }
    }
    componentDidMount() {
        this.draw()
    }
    loadShader(gl, type, source) {
        // Create shader object
        var shader = gl.createShader(type);
        if (shader == null) {
            console.error('unable to create shader');
            return null;
        }
        // Set the shader program
        gl.shaderSource(shader, source);
        // Compile the shader
        gl.compileShader(shader);
        // Check the result of compilation
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            var error = gl.getShaderInfoLog(shader);
            console.error('Failed to compile shader: ' + error);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    changeDpr(e) {
        console.log('change Dpr', e, this.state.dpr)
        let v = e.target.value
        this.setState(props => {
            props.dpr = v
            props.viewport.width = props.canvas.width = props.canvasBase.width * props.dpr
            props.viewport.height = props.canvas.height = props.canvasBase.height * props.dpr
            if (props.canvas.updateStyle) {
                props.canvasStyle.width = props.canvasBase.width * props.dpr
                props.canvasStyle.height = props.canvasBase.width * props.dpr
            }
            return props
        })
        setTimeout(() => {
            this.resetVp()
        }, 100)
    }

    toggleCanvasBindingStyle() {
        this.setState(props => {
            props.canvas.updateStyle = !props.canvas.updateStyle
            if (props.canvas.updateStyle) {
                props.canvasStyle.width = props.canvasBase.width * props.dpr
                props.canvasStyle.height = props.canvasBase.width * props.dpr
            } else {
                props.canvasStyle.width = props.canvasBase.width * 1
                props.canvasStyle.height = props.canvasBase.width * 1
            }
            return props
        })
        setTimeout(() => {
            this.resetVp()
        }, 100)
    }

    changeVp(e, type) {
        console.log('change vp', e, this.state.viewport)
        let v = e.target.value
        this.setState(props => {
            props.viewport[type] = v
            return props
        })
        setTimeout(() => {
            this.resetVp()
        }, 100)
    }
    changeCanvasStyle(e, type) {
        let v = e.target.value
        this.setState(props => {
            props.canvasStyle[type] = v
            return props
        })
        setTimeout(() => {
            this.rePaint(this.state.gl)
        }, 0)
    }
    changeCanvasState(e, type) {
        let v = e.target.value
        this.setState(props => {
            props.canvas[type] = v
            return props
        })
        setTimeout(() => {
            this.rePaint(this.state.gl)
        }, 0)
    }
    initVp() {
        this.setState(props => {
            props.dpr = window.devicePixelRatio
            props.viewport.width = props.canvas.width = props.canvasBase.width * props.dpr
            props.viewport.height = props.canvas.height = props.canvasBase.height * props.dpr
            if (props.canvas.updateStyle) {
                props.canvasStyle.width = props.canvasBase.width * props.dpr
                props.canvasStyle.height = props.canvasBase.width * props.dpr
            }
            return props
        })
        setTimeout(() => {
            this.resetVp()
        }, 100)
    }
    resetVp() {
        let gl = this.state.gl
        this.refs.canvas.width = this.state.canvas['width']
        this.refs.canvas.height = this.state.canvas['height']
        gl.viewport(this.state.viewport['left'], this.state.viewport['top'], this.state.viewport['width'], this.state.viewport['height']);
        console.log(this.state.canvas['width'], this.state.canvas['height'], 'a', this.state.viewport['left'], this.state.viewport['top'], this.state.viewport['width'], this.state.viewport['height'])
        setTimeout(() => {
            this.rePaint(gl)
        }, 0)
    }
    handleTouchStart(e) {
        console.log(e.touches)
        let t = e.touches[0]
        let rect = this.refs.canvas.getBoundingClientRect()
        console.log(t.clientX - rect.left, t.clientY - rect.top)
    }
    render() {
        let dpr = this.state.dpr
        let vp = this.state.viewport
        let style = this.state.canvasStyle
        let canvasState = this.state.canvas
        return (
            <div id="8-3" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>canva width/ height:<br />
                    width: {this.state.canvasBase.width}<br />
                    height: {this.state.canvasBase.height}</p>
                <p>canvas width binding style:<br />
                    {this.state.canvas.updateStyle.toString()}
                    <button onClick={() => this.toggleCanvasBindingStyle()}>toggle canvas binding style.</button>
                </p>
                <p>canva style width/ height:<br />
                    width: {this.state.canvasStyle.width}<br />
                    height: {this.state.canvasStyle.height}</p>
                <p>canvas:<br />
                    width: {this.state.canvas.width}<br />
                    height: {this.state.canvas.height}</p>
                <p>dpr:<input type="number" value={dpr} onChange={(e) => this.changeDpr(e)} /></p>
                <p>
                    viewport:<br />
                    left: <input type="number" value={vp.left} onChange={(e) => this.changeVp(e, 'left')} /><br />
                    top: <input type="number" value={vp.top} onChange={(e) => this.changeVp(e, 'top')} /><br />
                    width: <input type="number" value={vp.width} onChange={(e) => this.changeVp(e, 'width')} /><br />
                    height: <input type="number" value={vp.height} onChange={(e) => this.changeVp(e, 'height')} /><br />
                </p>
                <p>
                    canvas:<br />
                    style.width: <input type="number" value={style.width} onChange={(e) => this.changeCanvasStyle(e, 'width')} /><br />
                    style.height: <input type="number" value={style.height} onChange={(e) => this.changeCanvasStyle(e, 'height')} /><br />
                    canvas.width: <input type="number" value={canvasState.width} onChange={(e) => this.changeCanvasState(e, 'width')} /><br />
                    canvas.height: <input type="number" value={canvasState.height} onChange={(e) => this.changeCanvasState(e, 'height')} /><br />
                </p>
                <canvas className="webgl" style={{ width: this.state.canvasStyle.width + 'px', height: this.state.canvasStyle.height + 'px' }} width={this.state.canvas.width} height={this.state.canvas.height} ref="canvas" onTouchStart={(e) => this.handleTouchStart(e)}></canvas>
            </div>
        );
    }
}