import React from 'react';
import pic from '../../static/sky.jpg';
import pic2 from '../../static/circle.gif';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '4-5 多纹理',
            points: [],
            textureReady: false,
        }
    }
    draw() {
        let c = this.refs.canvas
        let gl = c.getContext('webgl')
        this.prepareGl(gl, new Float32Array([
                -0.5,0.5,0.0,1.0,
                -0.5,-0.5,0.0,0.0,
                0.5,0.5,1.0,1.0,
                0.5,-0.5,1.0,0.0
        ])).then(gl => {
            this.initTexture(gl, pic, 0, (gl) => {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR) // 设置纹理参数
            })
            this.initTexture(gl, pic2, 1, (gl) => {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR) // 设置纹理参数
            })
        })
    }

    
    componentDidMount() {
        this.draw()
    }
    prepareGl(gl, verticesTex) {
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
            uniform sampler2D u_Sampler0;
            uniform sampler2D u_Sampler1;
            varying vec2 v_TexCoord;
            void main () {
                vec4 color0 = texture2D(u_Sampler0, v_TexCoord);
                vec4 color1 = texture2D(u_Sampler1, v_TexCoord);
                gl_FragColor = color0 * color1;
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
        gl.n = 4
        return Promise.resolve(gl)
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

    initTexture (gl, pic, index, cb) {
        let texture = gl.createTexture() //创建并初始化了一个WebGLTexture 目标
        let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler'+index)
        let image = new Image()
        image.onload = () => {
            this.setState({
                textureReady: true
            });
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1) // 纹理图像预处理 webgl纹理坐标系与图片坐标系的y轴相反
            /**
             * webgl至少支持八个纹理单元gl.TEXTURE0,gl.TEXTURE1,...
             */
            gl.activeTexture(gl[`TEXTURE${index}`]) // 激活指定的纹理单元
            gl.bindTexture(gl.TEXTURE_2D, texture) // 将给定的 WebGLTexture 绑定到目标
            /**
             * 
             * 通过pname可以设置4个纹理参数
             * gl.TEXTURE_MAG_FILTER 放大方法
             * gl.TEXTURE_MIN_FILTER 缩小方法
             * gl.TEXTURE_WRAP_S 水平填充方法
             * gl.TEXTURE_WRAP_T 垂直填充方法
             * 
             */
            
            cb && cb(gl, image)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image) // 指定了二维纹理图像
            gl.uniform1i(u_Sampler, index) // 将纹理单元传递给片元着色器
            gl.clearColor(0,0.222,.333,1)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, gl.n)
        }
        image.onerror = e => console.error(e)
        image.src = pic
    }
    render() {
        return (
            <div id="2-1" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                材质：{this.state.textureReady ? '已加载' : '未加载'}
                <p><img src={pic}/><img src={pic2}/></p>
                <canvas className="webgl" width="400" height="400" ref="canvas" style={{margin:'5px'}}></canvas>
            </div>
        );
    }
}