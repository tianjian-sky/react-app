import React from 'react';
import cuon from '../../lib/cuon-matrix'

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '5-2 正交投影',
            gl: null,
            points: [],
            eyeAt: {
                x: 0.2,
                y: 0.25,
                z: 0.25
            },
            orth: {
                gNear: -1,
                gFar: 1,
                gLeft: -1,
                gRight: 1,
                gBottom: -1,
                gTop: 1
            }
        }
    }
    draw() {
        let c = this.refs.canvas
        let gl = c.getContext('webgl')
        this.state.gl = gl

        // 顶点着色器
        const VSHADER_SOURCE = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            uniform mat4 u_ProjMatrix;
            varying vec4 v_Color;
            void main(){
                gl_Position = u_ProjMatrix * a_Position;
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

        // 一个 WebGLProgram 对象由两个编译过后的 WebGLShader 组成 - 顶点着色器和片段着色器（均由 GLSL 语言所写）。这些组合成一个可用的 WebGL 着色器程序。
        gl.attachShader(program, vshader);
        gl.attachShader(program, fshader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS) ) {
            const info = gl.getProgramInfoLog(program);
            throw "Could not compile WebGL program. \n\n" + info;
        }
        gl.useProgram(program); // 一定要在变量赋值以前
        gl.program = program;

        // 设置顶点
        let verticesColors = new Float32Array([
            0.0,  0.6,  -0.4,  0.4,  1.0,  0.4, // The back green one
            -0.5, -0.4,  -0.4,  0.4,  1.0,  0.4,
            0.5, -0.4,  -0.4,  1.0,  0.4,  0.4, 
        
            0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
            -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
            0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 

            0.0,  0.5,   0.0,  0.4,  0.4,  1.0, // The front blue one 
            -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
            0.5, -0.5,   0.0,  1.0,  0.4,  0.4, 
        ])
        const FSIZE = verticesColors.BYTES_PER_ELEMENT // TypedArray.BYTES_PER_ELEMENT 属性代表了强类型数组中每个元素所占用的字节数。
        const STEP = FSIZE*6
        const n = 9
        gl.n = n

        let vertixBuffer = gl.createBuffer() // 缓冲区对象

        if (!vertixBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }
        let a_Position = gl.getAttribLocation(program, 'a_Position')
        let a_Color = gl.getAttribLocation(program, 'a_Color')
        if (a_Position < 0 || a_Color < 0) {
            console.log('Failed to get the storage location of a_position')
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer) // 将给定的WebGLBuffer绑定到目标。ARRAY_BUFFER，ELEMENT_ARRAY_BUFFER，UNIFORM_BUFFER。。
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW) // 创建并初始化了Buffer对象的数据存储区。
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STEP, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Position) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, STEP, FSIZE*3) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Color)
        this.rePaint(gl)
    }
    rePaint (gl) {
        let projMatrix = new cuon.Matrix4()
        projMatrix.setOrtho(this.state.orth.gLeft,this.state.orth.gRight,this.state.orth.gBottom,this.state.orth.gTop,this.state.orth.gNear, this.state.orth.gFar) // 设置正交投影矩阵，定义盒装可视空间
        let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix')
        gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements)

        if (u_ProjMatrix < 0) {
            console.log('Failed to get the storage location of a_position')
        }
        gl.clearColor(0,0.222,.333,1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, gl.n)
    }
    listenKeyDown (e) {
        e.preventDefault()
        if (e.keyCode == 39) { // right
            this.setState({
                orth: Object.assign(this.state.orth, {
                    gNear: this.state.orth.gNear + 0.01
                })
            })
        }
        if (e.keyCode == 37) { // left
            this.setState({
                orth: Object.assign(this.state.orth, {
                    gNear: this.state.orth.gNear - 0.01
                })
            })
        }
        if (e.keyCode == 38) { // up
            this.setState({
                orth: Object.assign(this.state.orth, {
                    gFar: this.state.orth.gFar + 0.01
                })
            })
        }
        if (e.keyCode == 40) { // down
            this.setState({
                orth: Object.assign(this.state.orth, {
                    gFar: this.state.orth.gFar - 0.01
                })
            })
        }
        if (e.keyCode == 65) { // A
            this.setState({
                orth: Object.assign(this.state.orth, {
                    gLeft: this.state.orth.gLeft - 0.01
                })
            })
        }
        if (e.keyCode == 68) { // D
            this.setState({
                orth: Object.assign(this.state.orth, {
                    gRight: this.state.orth.gRight + 0.01
                })
            })
        }
        if (e.keyCode == 87) { // W
            this.setState({
                orth: Object.assign(this.state.orth, {
                    gTop: this.state.orth.gTop - 0.01
                })
            })
        }
        if (e.keyCode == 83) { // S
            this.setState({
                orth: Object.assign(this.state.orth, {
                    gBottom: this.state.orth.gBottom + 0.01
                })
            })
        }
        this.rePaint(this.state.gl)
    }
    componentDidMount() {
        this.draw()
        document.body.addEventListener('keydown', this.listenKeyDown.bind(this))
    }
    loadShader (gl, type, source) {
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
    render() {
        return (
            <div id="2-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>Near:{this.state.orth.gNear}</p>
                <p>Far:{this.state.orth.gFar}</p>
                <p>Left:{this.state.orth.gLeft}</p>
                <p>Right:{this.state.orth.gRight}</p>
                <p>Top:{this.state.orth.gTop}</p>
                <p>Bottom:{this.state.orth.gBottom}</p>
                <canvas className="webgl" width="400" height="400" ref="canvas" ></canvas>
            </div>
        );
    }
}