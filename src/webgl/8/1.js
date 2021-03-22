import React from 'react';
import cuon from '../../lib/cuon-matrix'

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '8-1 Stencil',
            gl: null,
            points: [],
            perspective: {
                gNear: 1,
                gFar: 100,
                fov: 50,
                perspective: 1
            },
            lightPosition: {
                x: 0,
                y: 3,
                z: 4
            },
            translation: {
                rotateArm: -90,
                rotateJoint: 0,
                armLength: 10
            },
            depthTestEnable: true
        }
    }
    draw() {
        let c = this.refs.canvas
        let gl = c.getContext('webgl')
        this.state.gl = gl

        // 顶点着色器
        const VSHADER_SOURCE = `
            attribute vec3 aPos;
            attribute vec4 aColor;
            varying vec4 vColor;
            void main(void){
                gl_Position = vec4(aPos, 1);
                vColor = aColor;
            }
        `

        //片元着色器
        const FSHADER_SOURCE = `
            precision highp float;
            varying vec4 vColor;
            void main(void) {
                gl_FragColor = vColor;
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

        this.rePaint(gl)
    }
    rePaint (gl) {
        const stencil_color = [
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1
        ]
        const stencilVertex = [
            -.2, -.5,  0,
            .4,  -.5,  0,
            .3,   .6,   0
        ]


        const vertex = [
            -.5, -.2,  0,
            .5,  -.2,  0,
            0,   .6,   0
        ]
        const color = [
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 0, 1, 1
        ]
        let aPos = gl.getAttribLocation(gl.program, 'aPos')
        let aColor = gl.getAttribLocation(gl.program, 'aColor')


        const vertixBuffer = gl.createBuffer() // 缓冲区对象
        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(aPos) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。

        const colorBuffer = gl.createBuffer() // 缓冲区对象
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(aColor) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。

        
        gl.clearColor(0,0.222,.333,1)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // // 深度检测开启
        if (this.state.depthTestEnable) {
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.DEPTH_BUFFER_BIT)
        } else {
            gl.disable(gl.DEPTH_TEST)
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    listenKeyDown (e) {
        e.preventDefault()
        switch (e.keyCode) {
            case 38: // Up arrow key -> the positive rotation of joint1 around the z-axis
                if (this.state.translation.rotateJoint < 135) {
                    this.setState({
                        translation: Object.assign(this.state.translation, {
                            rotateJoint: this.state.translation.rotateJoint + 3
                        })
                    })
                }
                break;
            case 40: // Down arrow key -> the negative rotation of joint1 around the z-axis
                if (this.state.translation.rotateJoint > -135) {
                    this.setState({
                        translation: Object.assign(this.state.translation, {
                            rotateJoint: this.state.translation.rotateJoint - 3
                        })
                    })
                }
                break;
            case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
                this.setState({
                    translation: Object.assign(this.state.translation, {
                        rotateArm: this.state.translation.rotateArm + 3 % 360
                    })
                })
                break;
            case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
                this.setState({
                    translation: Object.assign(this.state.translation, {
                        rotateArm: this.state.translation.rotateArm - 3 % 360
                    })
                })
                break;
            default: return; // Skip drawing at no effective action
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
            <div id="8-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>Rotate:{this.state.translation.rotate}</p>
                <p>Light position:({this.state.lightPosition.x}, {this.state.lightPosition.y}, {this.state.lightPosition.z})</p>
                <canvas className="webgl" width="400" height="400" ref="canvas"></canvas>
            </div>
        );
    }
}