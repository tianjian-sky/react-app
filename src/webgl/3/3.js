import React from 'react';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '3-3 多个着色器',
            gl: null,
            points: []
        }
    }
    draw() {
        let c = this.refs.canvas
        let gl = c.getContext('webgl')
        this.state.gl = gl

        // 顶点着色器
        const VSHADER_SOURCE = `
            attribute vec4 a_Position;
            uniform mat4 u_mat;
            void main(){
                gl_Position = u_mat * a_Position;
                //gl_PointSize = 10.0;
            }
        `

        //片元着色器
        const FSHADER_SOURCE = `
            precision mediump float;
            uniform vec4 u_FragColor;
            void main () {
                gl_FragColor = u_FragColor;
            }
        `

        // 顶点着色器
        const VSHADER_SOURCE_2 = `
            attribute vec4 a_Position;
            uniform mat4 u_mat;
            void main(){
                gl_Position = a_Position;
            }
        `

        //片元着色器
        const FSHADER_SOURCE_2 = `
            precision mediump float;
            uniform vec4 u_FragColor;
            void main () {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1);
            }
        `

        // 创建一个 WebGL 着色器程序
        const program = gl.createProgram();
        const vshader = this.loadShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE)
        const fshader = this.loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE)
        const vshader2 = this.loadShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE_2)
        const fshader2 = this.loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE_2)

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
        let vertices = new Float32Array([-.5, .5, -.5, -.5, .5, .5, .5, -.5])
        let n = 4

        let vertixBuffer = gl.createBuffer() // 缓冲区对象
        if (!vertixBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer) // 将给定的WebGLBuffer绑定到目标。ARRAY_BUFFER，ELEMENT_ARRAY_BUFFER，UNIFORM_BUFFER。。
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW) // 创建并初始化了Buffer对象的数据存储区。

        let a_Position = gl.getAttribLocation(program, 'a_Position')
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Position) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        // 在WebGL中，作用于顶点的数据会先储存在attributes。这些数据仅对JavaScript代码和顶点着色器可用。
        // 属性由索引号引用到GPU维护的属性列表中。在不同的平台或GPU上，某些顶点属性索引可能具有预定义的值。创建属性时，WebGL层会分配其他属性。

        let u_FragColor = gl.getUniformLocation(program, 'u_FragColor')

        // 旋转
        let rad = 30 * 180 / Math.PI
        let tx = 0.3
        let ty = 0.3
        let tz = 0.3

        let sinB = Math.sin(rad)
        let cosB = Math.cos(rad)

        let u_mat = new Float32Array([ // 矩阵是二维的，而数组传输是一维的，所以是按行主序还是列主序？ 列主序（一列一列地输入）
            cosB, sinB, 0, 0,
            -sinB, cosB, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1
        ])

        let u_xformMatrix = gl.getUniformLocation(gl.program, 'u_mat')
        gl.uniformMatrix4fv(u_xformMatrix, false, u_mat)

        if (a_Position < 0 || u_FragColor < 0 || u_xformMatrix < 0) {
            console.log('Failed to get the storage location of a_position')
        }

        gl.uniform4f(u_FragColor, Math.random(), Math.random(), Math.random(), 1)

        gl.clearColor(0, 0.222, .333, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n)
        // gl.drawArrays(gl.LINE_LOOP, 0, n)
        gl.detachShader(program, vshader);
        gl.detachShader(program, fshader);
        gl.attachShader(program, vshader2);
        gl.attachShader(program, fshader2);
        gl.linkProgram(program);
        // gl.useProgram(program); // 一定要在变量赋值以前
        // gl.program = program;
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n)
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
    render() {
        return (
            <div id="3-3" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <canvas className="webgl" width="400" height="400" ref="canvas" ></canvas>
            </div>
        );
    }
}