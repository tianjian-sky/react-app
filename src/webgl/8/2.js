import React from 'react';
import cuon from '../../lib/cuon-matrix'

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '8-2 instance drawing',
            gl: null,
            points: [],
            eyeAt: {
                x: 0,
                y: 0,
                z: 0
            }
        }
    }
    draw() {
        let c = this.refs.canvas
        let gl = c.getContext('webgl2')
        this.state.gl = gl

        // 顶点着色器
        const VSHADER_SOURCE = `
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            uniform mat4 u_ViewMatrix;
            varying vec4 v_Color;
            void main(){
                gl_Position = u_ViewMatrix * a_Position;
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

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw "Could not compile WebGL program. \n\n" + info;
        }
        gl.useProgram(program); // 一定要在变量赋值以前
        gl.program = program;

        // 设置顶点
        let verticesColors = new Float32Array([
            0.0, .5, -.4, .4, 1, .4,
            -.5, -.5, -.4, .4, 1, .4,
            .5, -.5, -.4, 1, .4, .4,
            // .5, .4, -.2, 1, .4, .4,
            // -.5, .4, -.2, 1, 1, .4,
            // 0, -.6, -.2, 1, 1, .4,
            // 0, .5, 0, .4, .4, 1,
            // -.5, -.5, 0, .4, .4, 1,
            // .5, -.5, 0, 1, .4, .4
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
        if (a_Position < 0 || a_Color < 0) {
            console.log('Failed to get the storage location of a_position')
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer) // 将给定的WebGLBuffer绑定到目标。ARRAY_BUFFER，ELEMENT_ARRAY_BUFFER，UNIFORM_BUFFER。。
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW) // 创建并初始化了Buffer对象的数据存储区。
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, STEP, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Position) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, STEP, FSIZE * 3) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Color)
        // gl.vertexAttribDivisor(0, 2)
        // gl.vertexAttribDivisor(1, 2)
        this.rePaint(gl)
    }
    rePaint(gl) {
        let viewMatrix = new cuon.Matrix4()
        viewMatrix.setLookAt(this.state.eyeAt.x, this.state.eyeAt.y, this.state.eyeAt.z, 0, 0, 1, 0, 1, 0) // 视点(.2,.25,.25) 观察点（0，0，0）上方向（0，1，0）
        let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix')
        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements)

        if (u_ViewMatrix < 0) {
            console.log('Failed to get the storage location of a_position')
        }
        gl.clearColor(0, 0.222, .333, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLES, 0, gl.n)
        // gl.bindVertexArray
        // gl.drawElementsInstanced(gl.TRIANGLES, gl.indicesLenth, gl.UNSIGNED_SHORT, 0, 1);


    }
    listenKeyDown(e) {
        e.preventDefault()
        if (e.keyCode == 39) { // right
            this.setState({
                eyeAt: Object.assign(this.state.eyeAt, {
                    x: this.state.eyeAt.x - 0.01
                })
            })
        }
        if (e.keyCode == 37) { // left
            this.setState({
                eyeAt: Object.assign(this.state.eyeAt, {
                    x: this.state.eyeAt.x + 0.01
                })
            })
        }
        if (e.keyCode == 38) { // up
            this.setState({
                eyeAt: Object.assign(this.state.eyeAt, {
                    y: this.state.eyeAt.y + 0.01
                })
            })
        }
        if (e.keyCode == 40) { // down
            this.setState({
                eyeAt: Object.assign(this.state.eyeAt, {
                    y: this.state.eyeAt.y - 0.01
                })
            })
        }
        this.rePaint(this.state.gl)
    }
    componentDidMount() {
        this.draw()
        document.body.addEventListener('keydown', this.listenKeyDown.bind(this))
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
    render() {
        return (
            <div id="8-2" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>视点:({this.state.eyeAt.x},{this.state.eyeAt.y},{this.state.eyeAt.z})</p>
                <p>观察点:(0,0,0)</p>
                <p>上方向:(0,1,0)</p>
                <canvas className="webgl" width="400" height="400" ref="canvas" ></canvas>
            </div>
        );
    }
}