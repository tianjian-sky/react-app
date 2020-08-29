import React from 'react';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '1-3',
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
            void main(){
                gl_Position = a_Position;
                gl_PointSize = 10.0;
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

        var a_Position = gl.getAttribLocation(program, 'a_Position')
        var u_FragColor = gl.getUniformLocation(program, 'u_FragColor')
        if (a_Position < 0 || u_FragColor < 0) {
            console.log('Failed to get the storage location of a_position')
        }
        // gl.vertexAttrib1f, gl.vertexAttrib2f... gl.vertexAttrib4fv
        gl.vertexAttrib3f(a_Position, 1, 1, 1, 0)
        gl.uniform4f(u_FragColor, 0.5, 0.2, 1, 1)
        gl.useProgram(program);
        gl.program = program;

        gl.clearColor(0,0.222,.333,1)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.drawArrays(gl.POINTS, 0, 1)
    }
    drawPoint (e) {
        let bbox = e.target.getBoundingClientRect()
        
        // 坐标原点在canvas中心
        let x = (e.clientX - bbox.left - .5 * bbox.width) / (.5 * bbox.width)
        let y = (.5 * bbox.height - (e.clientY - bbox.top)) / (.5 * bbox.height)
        this.state.points.push([x, y])
        this.state.gl.clearColor(0,0.222,.333,1)
        this.state.gl.clear(this.state.gl.COLOR_BUFFER_BIT)
        
        this.state.points.forEach(p => {
            var a_Position = this.state.gl.getAttribLocation(this.state.gl.program, 'a_Position')
            var u_FragColor = this.state.gl.getUniformLocation(this.state.gl.program, 'u_FragColor')
            if (a_Position < 0 || u_FragColor < 0) {
                console.log('Failed to get the storage location of a_position')
            }
            
            this.state.gl.vertexAttrib3f(a_Position, p[0], p[1], 1, 1)
            this.state.gl.uniform4f(u_FragColor, Math.random(), Math.random(), Math.random(), 1)
            this.state.gl.drawArrays(this.state.gl.POINTS, 0, 1)
        })
        
    }
    componentDidMount() {
        this.draw()
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
            <div id="1-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <canvas className="webgl" width="400" height="400" ref="canvas" onClick={(e) => this.drawPoint(e)}></canvas>
            </div>
        );
    }
}