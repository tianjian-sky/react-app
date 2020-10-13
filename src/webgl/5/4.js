import React from 'react';
import cuon from '../../lib/cuon-matrix'

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '5-4 深度检测',
            gl: null,
            points: [],
            eyeAt: {
                x: 0.2,
                y: 0.25,
                z: 0.25
            },
            perspective: {
                gNear: 1,
                gFar: 100,
                fov: 30,
                perspective: 1
            },
            depthTestEnable: false
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
            uniform mat4 u_ModelMatrix;
            uniform mat4 u_ViewMatrix;
            uniform mat4 u_ProjMatrix;
            uniform mat4 u_MvpMatrix;
            varying vec4 v_Color;
            void main(){
                //gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
                gl_Position = u_MvpMatrix * a_Position;
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
            0,1,-5,.4,.4,1,
            -.5,-1,-5,.4,.4,1,
            .5,-1,-5,1,.4,.4,

            0,1,-10,1,1,.4,
            -.5,-1,-10,1,1,.4,
            .5,-1,-10,1,.4,.4,

            
            0,1,-15,.4,1,.4,
            -.5,-1,-15,.4,1,.4,
            .5,-1,-15,1,.4,.4,

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
        
        let projMatrix = new cuon.Matrix4() // 投影矩阵 1.根据三角形与视点的距离对三角形进行缩小， 2.对三角形进行平移（近大远小，透视法），3.定义可视空间
        /**
         * 远，近边界必须都大于0
         * 近大远小
         */
        projMatrix.setPerspective(this.state.perspective.fov, this.state.perspective.perspective, this.state.perspective.gNear, this.state.perspective.gFar)

        let viewMatrix = new cuon.Matrix4() // 视图矩阵 改变视线

        let modelMatrix = new cuon.Matrix4() // 模型矩阵，同一组顶点多次便宜，叠加绘制

        let mvpMatrix = new cuon.Matrix4() // 模型视图投影矩阵 = 投影矩阵 x 视图矩阵 x 模型矩阵
        

        
        let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix')
        let u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix')
        let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
        let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')


        gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements)
        gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements)


        if (u_ProjMatrix < 0) {
            console.log('Failed to get the storage location of a_position')
        }


        gl.clearColor(0,0.222,.333,1)
         // 深度检测开启
         if (this.state.depthTestEnable) {
            gl.enable(gl.DEPTH_TEST)
        } else {
            gl.disable(gl.DEPTH_TEST)
        }
       

        viewMatrix.setLookAt(0,0,5,0,0,-100,0,1,0)

        modelMatrix.setTranslate(.75,0,0)
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements)
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements)


        gl.drawArrays(gl.TRIANGLES, 0, gl.n)

        modelMatrix.setTranslate(-.75,0,0)
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix)
        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements)
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements)
        gl.drawArrays(gl.TRIANGLES, 0, gl.n)
    }
    listenKeyDown (e) {
        e.preventDefault()
        if (e.keyCode == 39) { // right
            this.setState({
                perspective: Object.assign(this.state.perspective, {
                    perspective: this.state.perspective.perspective + 0.1
                })
            })
        }
        if (e.keyCode == 37) { // left
            this.setState({
                perspective: Object.assign(this.state.perspective, {
                    perspective: this.state.perspective.perspective - 0.1
                })
            })
        }
        if (e.keyCode == 38) { // up
            this.setState({
                perspective: Object.assign(this.state.perspective, {
                    fov: this.state.perspective.fov + 1
                })
            })
        }
        if (e.keyCode == 40) { // down
            this.setState({
                perspective: Object.assign(this.state.perspective, {
                    fov: this.state.perspective.fov - 1
                })
            })
        }

        if (e.keyCode == 83) { // D
            this.setState({
                perspective: Object.assign(this.state.perspective, {
                    gNear: this.state.perspective.gNear + 1
                })
            })
        }
        if (e.keyCode == 87) { // W
            this.setState({
                perspective: Object.assign(this.state.perspective, {
                    gFar: this.state.perspective.gFar - 1
                })
            })
        }
        this.rePaint(this.state.gl)
    }
    componentDidMount() {
        this.draw()
        document.body.addEventListener('keydown', this.listenKeyDown.bind(this))
    }
    enableDepthTest(bol) {
        this.setState({
            depthTestEnable: bol
        })
        this.rePaint(this.state.gl)
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
                <h4>隐藏面消除：webgl默认安装顶点在缓冲区的顺序进行绘制，后绘制的图形会覆盖之前绘制的图形，隐藏面消除功能可以消除那些被遮挡的表面</h4>
                <p>fov:{this.state.perspective.fov}</p>
                <p>Perspective:{this.state.perspective.perspective}</p>
                <p>Near:{this.state.perspective.gNear}</p>
                <p>Far:{this.state.perspective.gFar}</p>
                隐藏面消除：{this.state.depthTestEnable ? '开启' : '关闭'}
                <p>
                    <button onClick={() => this.enableDepthTest(true)}>开启</button>&nbsp;&nbsp;&nbsp;
                    <button onClick={() => this.enableDepthTest(false)}>关闭</button>
                </p>
                <canvas className="webgl" width="400" height="400" ref="canvas"></canvas>
            </div>
        );
    }
}