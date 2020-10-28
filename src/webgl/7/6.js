import React from 'react'
import produce from "immer"
import cuon from '../../lib/cuon-matrix'

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '7-6 alpha 混合',
            gl: null,
            points: [],
            perspective: {
                gNear: 1,
                gFar: 1000,
                fov: 30,
                perspective: 1
            },
            lightPosition: {
                x: 0,
                y: 3,
                z: 4
            },
            translation: {
                rotateX: 0,
                rotateY: 0,
                rotateZ: 0,
                faceClicked: 0,
            },
            fogDist: {
                near: 55,
                far: 80
            },
            depthTestEnable: true,
            blendEnable: true,
            modelMatrixStack: []
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


            uniform mat4 u_MvpMatrix;
            uniform mat4 u_ModelMatrix;
            uniform mat4 u_NormalMatrix;
            uniform int u_PickedFace; // 点击的表面编号

            varying float v_Dist;
            uniform vec4 u_Eye;

            uniform vec3 u_LightColor;
            uniform vec3 u_LightPosition;
            uniform vec3 u_AmbientLight;
            varying vec4 v_Color;

            void main(){

                gl_Position = u_MvpMatrix * a_Position;

                v_Color = a_Color;
            }
        `

        //片元着色器
        const FSHADER_SOURCE = `
            precision mediump float;
            varying vec4 v_Color;

            uniform vec3 u_FogColor;
            uniform vec2 u_FogDist;
            varying float v_Dist;

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
        const verticesColors = new Float32Array([
            0.0,  0.5,  -0.4,  0.4,  1.0,  0.4,  0.4, // The back green one
           -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,  0.4,
            0.5, -0.5,  -0.4,  1.0,  0.4,  0.4,  0.4, 
           
            0.5,  0.4,  -0.2,  1.0,  0.4,  0.4,  0.4, // The middle yerrow one
           -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,  0.4,
            0.0, -0.6,  -0.2,  1.0,  1.0,  0.4,  0.4, 
        
            0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  0.4,  // The front blue one 
           -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,  0.4,
            0.5, -0.5,   0.0,  1.0,  0.4,  0.4,  0.4, 
          ]);
       

        gl.n = 9;



        let vertixBuffer = gl.createBuffer() // 缓冲区对象

        if (!vertixBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }

       
        const FSIZE = verticesColors.BYTES_PER_ELEMENT;



        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer) // 将给定的WebGLBuffer绑定到目标。ARRAY_BUFFER，ELEMENT_ARRAY_BUFFER，UNIFORM_BUFFER。。
        gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW) // 创建并初始化了Buffer对象的数据存储区。
        let a_Position = gl.getAttribLocation(program, 'a_Position')
        
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 7, 0);
        gl.enableVertexAttribArray(a_Position) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。

        let a_Color = gl.getAttribLocation(program, 'a_Color')
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 7, FSIZE * 3);
        gl.enableVertexAttribArray(a_Color)


        this.rePaint(gl)
    }
    rePaint (gl) {
        
        this.setState({
            modelMatrixStack: []
        })
        /**
         * 远，近边界必须都大于0
         * 近大远小
         */
        
        let projMatrix = new cuon.Matrix4() // 投影矩阵 1.根据三角形与视点的距离对三角形进行缩小， 2.对三角形进行平移（近大远小，透视法），3.定义可视空间
        let viewMatrix = new cuon.Matrix4() // 视图矩阵 改变视线
        let modelMatrix = new cuon.Matrix4() // 模型矩阵，同一组顶点多次便宜，叠加绘制
        let mvpMatrix = new cuon.Matrix4() // 模型视图投影矩阵 = 投影矩阵 x 视图矩阵 x 模型矩阵

        projMatrix.setOrtho(-1, 1, -1, 1, 0, 2)

        // 视点 在世界坐标系下的坐标
        const eye = new Float32Array([.2,.25,.25,1])



        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT)

        // // 深度检测开启
        if (this.state.depthTestEnable) {
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.DEPTH_TEST)
        } else {
            gl.disable(gl.DEPTH_TEST)
        }

        // 开启混合
        if (this.state.blendEnable) {
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        } else {
            gl.disable(gl.BLEND)
        }

        viewMatrix.setLookAt(eye[0], eye[1], eye[2], 0, 0, 0, 0, 1, 0);



        let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')


        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix)


        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);


        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES,0, gl.n);   // Draw
    }
    saveModelMatrix (m) {
        let m2 = new cuon.Matrix4(m)
        this.state.modelMatrixStack.push(m2)
    }
    popModelMatrix () {
        let out =  this.state.modelMatrixStack.pop()
        return out
    }
    enableBlend (bol) {
        this.setState(produce(draft => {
            draft.blendEnable = bol
        }))
        setTimeout(() => {
            this.rePaint(this.state.gl)
        }, 0)
    }
    listenKeyDown (e) {
        e.preventDefault()
        switch (e.keyCode) {
            case 87: //  W key -> Increase the maximum distance of fog
                this.setState({
                    fogDist: produce(this.state.fogDist, draft => {
                        draft.far += 1
                    })
                })
                break;
            case 83: // S key -> Decrease the maximum distance of fog
                if (this.state.fogDist.far > this.state.fogDist.near) {
                    this.setState({
                        fogDist: produce(this.state.fogDist, draft => {
                            draft.far -= 1
                        })
                    })
                }
            break;
            case 40: // Up arrow key -> the positive rotation of joint1 around the z-axis
                this.setState({
                    translation: produce(this.state.translation, draft => {
                        draft.rotateX += 1
                    })
                })
                break;
            case 38: // Down arrow key -> the negative rotation of joint1 around the z-axis
                this.setState({
                    translation: produce(this.state.translation, draft => {
                        draft.rotateX -= 1
                    })
                })
                break;
            case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
                this.setState({
                    translation: produce(this.state.translation, draft => {
                        draft.rotateY += 1
                    })
                })
                break;
            case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
                this.setState({
                    translation: produce(this.state.translation, draft => {
                        draft.rotateY -= 1
                    })
                })
                break;
            default:
                break
        }
        setTimeout(() => {
            this.rePaint(this.state.gl)
        }, 0)
    }
    clickHandler(e) {
        
        let x = e.clientX
        let y = e.clientY
        this.setState({
            translation: produce(this.state.translation, draft => {
                draft.faceClicked = 0
            })
        })
        
        setTimeout(() => {
            this.getClickFace(x, y)
        }, 0)
    }
    getClickFace (x, y) {
        const gl = this.state.gl
        const el = this.refs.canvas
        const geo = el.getBoundingClientRect()
        const u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace');

        x = x - geo.left
        y = geo.top + geo.height - y // 右手系，y轴正方向朝上

        let pixels = new Uint8Array(4); // Array for storing the pixel value
        gl.uniform1i(u_PickedFace, this.state.translation.faceClicked);  // Draw by writing surface number into alpha value
        this.rePaint(gl)
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        let face = 0
        if (pixels[0] != 0) {
            this.setState({
                translation: produce(this.state.translation, draft => {
                    draft.faceClicked = pixels[3]
                })
            })
        }
        setTimeout(() => {
            this.rePaint(gl)
        }, 0)
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
            <div id="7-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>Blend模式:{this.state.blendEnable ? '开启' : '关闭'}
                    <button  onClick={() => this.enableBlend(true)}>开启</button><button  onClick={() => this.enableBlend(false)}>关闭</button></p>
                <canvas className="webgl" width="400" height="400" ref="canvas" onClick={this.clickHandler.bind(this)}></canvas>
            </div>
        );
    }
}