import React from 'react';
import pic from '../../static/sky.jpg';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '4-4 纹理',
            gl: null,
            points: [],
            textureReady: false,
        }
    }
    draw() {
        let c = this.refs.canvas
        let gl = c.getContext('webgl')
        this.state.gl = gl

        // 顶点着色器
        const VSHADER_SOURCE = `
            attribute vec4 a_Position;
            attribute vec2 a_TexCoord;
            varying vec2 v_TexCoord;

            void main(){
                gl_Position = a_Position;
                v_TexCoord = a_TexCoord;
            }
        `

        /*
        * varying 变量 webgl中，顶点着色器和片元着色器有类型和命名都相同的verying变量，
        * 则顶点着色器赋值该变量会自动传入片元着色器
        */

        //片元着色器
        const FSHADER_SOURCE = `
            #ifdef GL_ES
            precision mediump float;
            #endif
            uniform sampler2D u_Sampler;
            varying vec2 v_TexCoord;
            void main () {
                gl_FragColor = texture2D(u_Sampler, v_TexCoord);
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
        let verticesTex = new Float32Array([
            -0.5,0.5,0.0,1.0,
            -0.5,-0.5,0.0,0.0,
            0.5,0.5,1.0,1.0,
            0.5,-0.5,1.0,0.0
        ])
        let n = 4


        let vertexTexCoordBuffer = gl.createBuffer() // 缓冲区对象

        if (!vertexTexCoordBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }
        let a_Position = gl.getAttribLocation(program, 'a_Position')
        let a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord')
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer) // 将给定的WebGLBuffer绑定到目标。ARRAY_BUFFER，ELEMENT_ARRAY_BUFFER，UNIFORM_BUFFER。。
        gl.bufferData(gl.ARRAY_BUFFER, verticesTex, gl.STATIC_DRAW) // 创建并初始化了Buffer对象的数据存储区。

        const FSIZE = verticesTex.BYTES_PER_ELEMENT // TypedArray.BYTES_PER_ELEMENT 属性代表了强类型数组中每个元素所占用的字节数。

        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*4, 0) // 绑定buffer到vertex attribute *设置步长和偏移
        gl.enableVertexAttribArray(a_Position) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        // 在WebGL中，作用于顶点的数据会先储存在attributes。这些数据仅对JavaScript代码和顶点着色器可用。
        // 属性由索引号引用到GPU维护的属性列表中。在不同的平台或GPU上，某些顶点属性索引可能具有预定义的值。创建属性时，WebGL层会分配其他属性。
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE*4, FSIZE*2) // 绑定buffer到vertex attribute *设置步长和偏移
        gl.enableVertexAttribArray(a_TexCoord) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        
        

        gl.clearColor(0,0.222,.333,1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n)
        this.initTexture(gl, pic, n)
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

    initTexture (gl, pic, n) {
        let texture = gl.createTexture()
        let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler')
        let image = new Image()
        image.onload = () => {
            this.setState({
                textureReady: true
            });
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, texture)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
            gl.uniform1i(u_Sampler, 0)
            gl.clearColor(0,0.222,.333,1)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, n)
        }
        image.onerror = e => console.error(e)
        image.src = pic
    }
    render() {
        return (
            <div id="2-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                材质：{this.state.textureReady ? '已加载' : '未加载'}
                <p><img src={pic}/></p>
                <canvas className="webgl" width="400" height="400" ref="canvas" ></canvas>
            </div>
        );
    }
}