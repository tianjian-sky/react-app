import React from 'react';
import cuon from '../../lib/cuon-matrix'

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '6-4 点光源',
            gl: null,
            points: [],
            perspective: {
                gNear: 1,
                gFar: 100,
                fov: 30,
                perspective: 1
            },
            lightPosition: {
                x: 0,
                y: 3,
                z: 4
            },
            translation: {
                rotate: 0,
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
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            attribute vec4 a_Normal;
            uniform mat4 u_MvpMatrix;
            uniform mat4 u_ModelMatrix;
            uniform mat4 u_NormalMatrix;
            uniform vec3 u_LightColor;
            uniform vec3 u_LightPosition;
            uniform vec3 u_AmbientLight;
            varying vec4 v_Color;
            void main(){

                gl_Position = u_MvpMatrix * a_Position;

                // 变换后的法向量 = 模型矩阵的逆转置矩阵 x 原法向量
                vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));

                vec4 vetexPosition = u_ModelMatrix * a_Position;
                vec3 lightDirection = normalize(u_LightPosition - vec3(vetexPosition));
                
                float nDotL = max(dot(lightDirection, normal), 0.0); // 计算光线方向和法向量的点积  a.b = |a||b|cosA =
                
                vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL; // 平行光反射颜色 = 入射光颜色 * 基底颜色 * cosA
                vec3 ambient = u_AmbientLight * a_Color.rgb; // 环境光反射颜色 = 入射光颜色 * 基底颜色
                v_Color = vec4(diffuse + ambient, a_Color.a);
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
        /**
         * 每个顶点出现3次，因为一个顶点与3个面有关，出现3次就可以为相接的3个面绘制不同的颜色
         */
        const vertices = new Float32Array([   // Vertex coordinates
            1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
            1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
            1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
           -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
           -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
            1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
        ]);
       
        const colors = new Float32Array([     // Colors
           0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
           0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
           1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
           1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
           1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
           0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
        ]);
        // Indices of the vertices
        // Create a cube
        //    v6----- v5
        //   /|      /|
        //  v1------v0|
        //  | |     | |
        //  | |v7---|-|v4
        //  |/      |/
        //  v2------v3

         /**
          *  指定绘制的顶点的顺序 ，从而达到复用顶点的目的，gl.drawArrays复用顶点的程度取决于mode，非常有限
          *  绑定到一个gl.ELEMENT_ARRAY_BUFFER
          *  后调用 gl.drawElements(gl.TRIANGLES, gl.n, gl.UNSIGNED_BYTE, 0)
         **/

        const indices = new Uint8Array([       // Indices of the vertices
            0, 1, 2,   0, 2, 3,    // front
            4, 5, 6,   4, 6, 7,    // right
            8, 9,10,   8,10,11,    // up
            12,13,14,  12,14,15,    // left
            16,17,18,  16,18,19,    // down
            20,21,22,  20,22,23     // back
        ]);
        gl.n = indices.length

        /**
         * 每个顶点会参与3个面6个三角形绘制，这3个面绘制时都需要计算反射光颜色，需要知道这个面的法向量
         * 所以需要一个法向量的buffer，与顶点一一对应，
         */
        const normals = new Float32Array([
            0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
            1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
            0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
           -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
            0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
            0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
        ]);

        let vertixBuffer = gl.createBuffer() // 缓冲区对象
        let colorBuffer = gl.createBuffer() // 缓冲区对象
        let indexBuffer = gl.createBuffer()
        let normalBuffer = gl.createBuffer()

        if (!vertixBuffer || !indexBuffer || !colorBuffer || !normalBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }

        let a_Position = gl.getAttribLocation(program, 'a_Position')
        let a_Color = gl.getAttribLocation(program, 'a_Color')
        let a_Normal = gl.getAttribLocation(program, 'a_Normal')
        if (a_Position < 0 || a_Color < 0 || a_Normal < 0) {
            console.log('Failed to get the storage location of a_position')
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer) // 将给定的WebGLBuffer绑定到目标。ARRAY_BUFFER，ELEMENT_ARRAY_BUFFER，UNIFORM_BUFFER。。
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW) // 创建并初始化了Buffer对象的数据存储区。
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Position) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。
        
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Color)

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Normal)

        // Write the indices to the buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
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

        let normalMaytrix = new cuon.Matrix4() // 模型矩阵的逆转置矩阵 x 原法向量 = 变换后的法向量

        modelMatrix.setTranslate(0, 0, 0)
        modelMatrix.rotate(this.state.translation.rotate, 0, 0 , 1)
        
        viewMatrix.setLookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix)

        normalMaytrix.setInverseOf(modelMatrix)
        normalMaytrix.transpose()


        let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor')
        // let u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection')
        let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
        let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
        let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition')
        let u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight')
        let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix')

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMaytrix.elements);

        gl.uniform3f(u_LightColor, 1,1,1)
        gl.uniform3f(u_LightPosition, this.state.lightPosition.x, this.state.lightPosition.y, this.state.lightPosition.z)

        gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2)

        gl.clearColor(0,0.222,.333,1)
        gl.clear(gl.COLOR_BUFFER_BIT)

        // // 深度检测开启
        if (this.state.depthTestEnable) {
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.DEPTH_TEST)
        } else {
            gl.disable(gl.DEPTH_TEST)
        }
        // gl.drawArrays(gl.POINTS, 0, 8)
        gl.drawElements(gl.TRIANGLES, gl.n, gl.UNSIGNED_BYTE, 0)
    }
    listenKeyDown (e) {
        e.preventDefault()
        if (e.keyCode == 68) { // d
            this.setState({
                translation: Object.assign(this.state.translation, {
                    rotate: this.state.translation.rotate + 1
                })
            })
        }
        if (e.keyCode == 65) { // a
            this.setState({
                translation: Object.assign(this.state.translation, {
                    rotate: this.state.translation.rotate - 1
                })
            })
        }
        if (e.keyCode == 39) { // right
            this.setState({
                lightPosition: Object.assign(this.state.lightPosition, {
                    x: this.state.lightPosition.x + .1
                })
            })
        }
        if (e.keyCode == 37) { // left
            this.setState({
                lightPosition: Object.assign(this.state.lightPosition, {
                    x: this.state.lightPosition.x - .1
                })
            })
        }
        if (e.keyCode == 38) { // up
            this.setState({
                lightPosition: Object.assign(this.state.lightPosition, {
                    y: this.state.lightPosition.y + .1
                })
            })
        }
        if (e.keyCode == 40) { // down
            this.setState({
                lightPosition: Object.assign(this.state.lightPosition, {
                    y: this.state.lightPosition.y - .1
                })
            })
        }
        if (e.keyCode == 83) { // s
            this.setState({
                lightPosition: Object.assign(this.state.lightPosition, {
                    z: this.state.lightPosition.z + .1
                })
            })
        }
        if (e.keyCode == 87) { // w
            this.setState({
                lightPosition: Object.assign(this.state.lightPosition, {
                    z: this.state.lightPosition.z - .1
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
            <div id="6-4" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>Rotate:{this.state.translation.rotate}</p>
                <p>Light position:({this.state.lightPosition.x}, {this.state.lightPosition.y}, {this.state.lightPosition.z})</p>
                <canvas className="webgl" width="400" height="400" ref="canvas"></canvas>
            </div>
        );
    }
}