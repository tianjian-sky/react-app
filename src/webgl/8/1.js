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
            depthTestEnable: false,
            stencilTestEnable: true,
        }
    }
    draw() {
        let c = this.refs.canvas
        let gl = c.getContext('webgl', {
            stencil: true
        })
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

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw "Could not compile WebGL program. \n\n" + info;
        }
        gl.useProgram(program); // 一定要在变量赋值以前
        gl.program = program;

        this.rePaint(gl)
    }
    rePaint(gl) {
        const stencil_color = [
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1
        ]
        const stencilVertex = [
            -.2, 0, 0,
            .2, 0, 0,
            0, .3, 0
        ]

        const vertex = [
            -.5, -.2, 0,
            .5, -.2, 0,
            0, .6, 0
        ]
        const color = [
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 0, 1, 1
        ]

        gl.clearColor(0, 0.222, .333, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        if (this.state.stencilTestEnable) {
            gl.enable(gl.STENCIL_TEST)
        } else {
            gl.disable(gl.STENCIL_TEST)
        }

        // // 深度检测开启
        if (this.state.depthTestEnable) {
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.DEPTH_BUFFER_BIT)
        } else {
            gl.disable(gl.DEPTH_TEST)
        }

        let aPos = gl.getAttribLocation(gl.program, 'aPos')
        let aColor = gl.getAttribLocation(gl.program, 'aColor')

        /**
         * stencilFunc(func, ref, mask)
         * func:
         *  gl.NEVER: Never pass.
            gl.LESS: Pass if (ref & mask) < (stencil & mask).
            gl.EQUAL: Pass if (ref & mask) = (stencil & mask).
            gl.LEQUAL: Pass if (ref & mask) <= (stencil & mask).
            gl.GREATER: Pass if (ref & mask) > (stencil & mask).
            gl.NOTEQUAL: Pass if (ref & mask) !== (stencil & mask).
            gl.GEQUAL: Pass if (ref & mask) >= (stencil & mask).
            gl.ALWAYS: Always pass.
         * 
         * ref:
         * A GLint specifying the reference value for the stencil test. 
         * This value is clamped to the range 0 to 2^n - 1 where n is the number of bitplanes in the stencil buffer. The default value is 0.
         * 
         * mask:
         * A GLuint specifying a bit-wise mask that is used to AND the reference value and the stored stencil value when the test is done. 
         * The default value is all 1.
         */
        // Always pass test
        gl.stencilFunc(gl.GREATER, 1, 0xff);

        // 以下操作都针对的是模版缓冲
        // gl.KEEP
        // Keeps the current value. 即当前模版缓冲内容不变

        // gl.ZERO
        // Sets the stencil buffer value to 0.

        // gl.REPLACE
        // Sets the stencil buffer value to the reference value as specified by WebGLRenderingContext.stencilFunc().

        // gl.INCR
        // Increments the current stencil buffer value. Clamps to the maximum representable unsigned value.

        // gl.INCR_WRAP
        // Increments the current stencil buffer value. Wraps stencil buffer value to zero when incrementing the maximum representable unsigned value.

        // gl.DECR
        // Decrements the current stencil buffer value. Clamps to 0.

        // gl.DECR_WRAP
        // Decrements the current stencil buffer value. Wraps stencil buffer value to the maximum representable unsigned value when decrementing a stencil buffer value of 0.

        // gl.INVERT
        // Inverts the current stencil buffer value bitwise.

        /**
         * stencilOp(fail, zfail, zpass)
         * fail
         * A GLenum specifying the function to use when the stencil test fails. The default value is gl.KEEP               
         * 
         * zfail
         * A GLenum specifying the function to use when the stencil test passes, but the depth test fails. The default value is gl.KEEP.
         * 
         * zpass
         * A GLenum specifying the function to use when both the stencil test and the depth test pass, 
         * or when the stencil test passes and there is no depth buffer or depth testing is disabled. The default value is gl.KEEP
         */
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);

        /**
         * stencilMask() method of the WebGL API controls enabling and disabling of both the front and back writing of individual bits in the stencil planes.
         * STENCIL_WRITEMASK, STENCIL_BACK_WRITEMASK
         * 
         * 由于在图形API中，三角形有正反面之分，例如我们渲染一个正方体，我们能够看见的面渲染的是其三角形正面，而我们看不见的面渲染的则是背面。
         * 因此在使用模板测试时，我们需要考虑当前渲染的三角形是正面还是反面。针对三角形的两种面，我们需要在图形API中设置两套模板测试的参数，包含一个模板比较函数与三个模板操作函数。在D3D12中对应D3D12_DEPTH_STENCIL_DESC的FrontFace和BackFace两个属性，在OpenGL中通过glStencilFuncSeparate来设置。
         */

        /**
         * 和深度测试的glDepthMask函数一样，模板缓冲也有一个类似的函数。glStencilMask允许我们设置一个位掩码(Bitmask)，它会与将要写入缓冲的模板值进行与(AND)运算。默认情况下设置的位掩码所有位都为1，不影响输出，但如果我们将它设置为0x00，写入缓冲的所有模板值最后都会变成0.这与深度测试中的glDepthMask(GL_FALSE)是等价的。
            glStencilMask(0xFF); // 每一位写入模板缓冲时都保持原样
            glStencilMask(0x00); // 每一位在写入模板缓冲时都会变成0（禁用写入）
            大部分情况下你都只会使用0x00或者0xFF作为模板掩码(Stencil Mask)，但是知道有选项可以设置自定义的位掩码总是好的。
         */
        // gl.stencilMask(0xf0); 这样就不写入了
        gl.stencilMask(0xff);

        console.warn('STENCIL_WRITEMASK', gl.getParameter(gl.STENCIL_WRITEMASK))
        console.warn('STENCIL_BACK_WRITEMASK', gl.getParameter(gl.STENCIL_BACK_WRITEMASK))
        console.warn('STENCIL_BITS', gl.getParameter(gl.STENCIL_BITS))

        // GL_STENCIL_BUFFER_BIT: stencil buffer
        gl.clear(gl.STENCIL_BUFFER_BIT);
        // // No need to display the triangle
        gl.colorMask(0, 0, 0, 0);

        console.warn('STENCIL_FUNC', gl.getParameter(gl.STENCIL_FUNC))
        console.warn('STENCIL_VALUE_MASK', gl.getParameter(gl.STENCIL_VALUE_MASK))
        console.warn('STENCIL_REF', gl.getParameter(gl.STENCIL_REF))
        console.warn('STENCIL_BACK_FUNC', gl.getParameter(gl.STENCIL_BACK_FUNC))
        console.warn('STENCIL_BACK_VALUE_MASK', gl.getParameter(gl.STENCIL_BACK_VALUE_MASK))
        console.warn('STENCIL_BACK_REF', gl.getParameter(gl.STENCIL_BACK_REF))
        console.warn('STENCIL_BITS', gl.getParameter(gl.STENCIL_BITS))

        const colorBuffer = gl.createBuffer() // 缓冲区对象
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stencil_color), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(aColor) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。

        const vertixBuffer = gl.createBuffer() // 缓冲区对象
        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(stencilVertex), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(aPos) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // Pass test if stencil value is 1
        gl.stencilFunc(gl.EQUAL, 1, 0xFF);
        gl.stencilMask(0x00);

        /**
         * colorMask(red, green, blue, alpha)
         * colorMask() method of the WebGL API sets which color components to enable or to disable when drawing or rendering to a WebGLFramebuffer.
         */
        gl.colorMask(1, 1, 1, 1);

        // draw the clipped triangle
        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(aPos) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
        gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(aColor) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    listenKeyDown(e) {
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
    toggleStencil() {
        this.setState({
            stencilTestEnable: !this.state.stencilTestEnable
        })
        setTimeout(() => {
            this.rePaint(this.state.gl)
        }, 10)
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
            <div id="8-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>Rotate:{this.state.translation.rotate}</p>
                <p>Light position:({this.state.lightPosition.x}, {this.state.lightPosition.y}, {this.state.lightPosition.z})</p>
                <p>stencilTestEnable:({this.state.stencilTestEnable})</p>
                <p><button onClick={() => this.toggleStencil()}>打开/关闭模版</button></p>
                <canvas className="webgl" width="400" height="400" ref="canvas"></canvas>
            </div>
        );
    }
}