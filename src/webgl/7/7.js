import React from 'react'
import produce from "immer"
import cuon from '../../lib/cuon-matrix'

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '7-7 半透明三维物体',
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
            depthBufferLocked: false,
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
            attribute vec4 a_Normal;
            attribute float a_Face; // 表面编号

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

                // 变换后的法向量 = 模型矩阵的逆转置矩阵 x 原法向量
                // vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));

                // vec4 vetexPosition = u_ModelMatrix * a_Position;
                // vec3 lightDirection = normalize(u_LightPosition - vec3(vetexPosition));
                
                // float nDotL = max(dot(lightDirection, normal), 0.0); // 计算光线方向和法向量的点积  a.b = |a||b|cosA =
                // int face = int(a_Face);
                //vec4 color = (face == u_PickedFace) ? vec4(1, 1, 0, 0) : a_Color;
                //vec4 color = vec4(1.0, a_Face, 0.0, 1.0);
                // vec3 diffuse = u_LightColor * vec3(color) * nDotL; // 平行光反射颜色 = 入射光颜色 * 基底颜色 * cosA
                // vec3 ambient = u_AmbientLight * color.rgb; // 环境光反射颜色 = 入射光颜色 * 基底颜色
                // if(u_PickedFace == 0) {
                //     v_Color = vec4(color.rgb, a_Face/255.0);
                // } else {
                //     v_Color = vec4(diffuse + ambient, color.a);
                // }
                v_Color = a_Color;
                v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);
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
                //float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
                //vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);
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
        const vertices = new Float32Array([   // Vertex coordinates
            1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
            1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
            1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
            -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
            -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
            1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
        ]);
       
        const colors = new Float32Array([   // Colors
            0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  // v0-v1-v2-v3 front(blue)
            0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  // v0-v3-v4-v5 right(green)
            1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  // v0-v5-v6-v1 up(red)
            1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  // v1-v6-v7-v2 left
            1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  // v7-v4-v3-v2 down
            0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4   // v4-v7-v6-v5 back
        ]);
        
        const faces = new Uint8Array([   // Faces
            1, 1, 1, 1,     // v0-v1-v2-v3 front
            2, 2, 2, 2,     // v0-v3-v4-v5 right
            3, 3, 3, 3,     // v0-v5-v6-v1 up
            4, 4, 4, 4,     // v1-v6-v7-v2 left
            5, 5, 5, 5,     // v7-v4-v3-v2 down
            6, 6, 6, 6,     // v4-v7-v6-v5 back
        ]);

        
        const indices = new Uint8Array([   // Indices of the vertices
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
            0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
            1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
            0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
            0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
            0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
        ]);

        let vertixBuffer = gl.createBuffer() // 缓冲区对象
        let indexBuffer = gl.createBuffer()
        let normalBuffer = gl.createBuffer()
        let faceBuffer = gl.createBuffer()

        let colorBuffer = gl.createBuffer()

        if (!vertixBuffer || !indexBuffer || !normalBuffer || !faceBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }

        let a_Position = gl.getAttribLocation(program, 'a_Position')
        let a_Color = gl.getAttribLocation(program, 'a_Color')
        let a_Normal = gl.getAttribLocation(program, 'a_Normal')
        let a_Face = gl.getAttribLocation(program, 'a_Face')

       

        if (a_Position < 0 || a_Color < 0 || a_Normal < 0 || a_Face < 0) {
            console.log('Failed to get the storage location of a_position')
        }

        const FSIZE = faceBuffer.BYTES_PER_ELEMENT;

        gl.bindBuffer(gl.ARRAY_BUFFER, faceBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, faces, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_Face, 1, gl.UNSIGNED_BYTE, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Face)


        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer) // 将给定的WebGLBuffer绑定到目标。ARRAY_BUFFER，ELEMENT_ARRAY_BUFFER，UNIFORM_BUFFER。。
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW) // 创建并初始化了Buffer对象的数据存储区。
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Position) // 激活每一个属性以便使用，不被激活的属性是不会被使用的。一旦激活，以下其他方法就可以获取到属性的值了，包括vertexAttribPointer()，vertexAttrib*()，和 getVertexAttrib()。

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 3, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Normal)

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
        gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, 0, 0) // 绑定buffer到vertex attribute
        gl.enableVertexAttribArray(a_Color)



        // Write the indices to the buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
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
        let normalMaytrix = new cuon.Matrix4() // 模型矩阵的逆转置矩阵 x 原法向量 = 变换后的法向量

        projMatrix.setPerspective(this.state.perspective.fov, this.state.perspective.perspective, this.state.perspective.gNear, this.state.perspective.gFar)

        let u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor')
        let u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition')
        let u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight')
        let u_PickedFace = gl.getUniformLocation(gl.program, 'u_PickedFace')

        let u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor')
        let u_FogDist = gl.getUniformLocation(gl.program, 'u_FogDist')
        let u_Eye = gl.getUniformLocation(gl.program, 'u_Eye')


        const fogColor = new Float32Array([.137,.231,.423])
        // 雾化的起点与终点 与 视点的距离
        const fogDist = new Float32Array([this.state.fogDist.near, this.state.fogDist.far])
        // 视点 在世界坐标系下的坐标
        const eye = new Float32Array([3, 3, 7])


        gl.uniform1i(u_PickedFace, this.state.translation.faceClicked);
        gl.uniform3f(u_LightColor, 1,1,1)
        gl.uniform3f(u_LightPosition, this.state.lightPosition.x, this.state.lightPosition.y, this.state.lightPosition.z)
        gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2)

        gl.uniform3fv(u_FogColor, fogColor)
        gl.uniform2fv(u_FogDist, fogDist)
        gl.uniform4fv(u_Eye, eye)

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT)

        // 深度检测开启
        if (this.state.depthTestEnable) {
            gl.enable(gl.DEPTH_TEST)
            gl.clear(gl.DEPTH_BUFFER_BIT)
        } else {
            gl.disable(gl.DEPTH_TEST)
        }

        /**
         * 对于深度不同的片元，如果开启了深度检测，就意味着绘制时会发生隐藏面消除，
         * 此时被遮挡的片元会被剔除，因此颜色混合也就无从谈起了。
         * 
         * 因此对于3维图形，如果要进行颜色混合，有以下两种办法
         * 
         * 1.关闭深度检测 (不实际)
         * 
         * 2.开启深度检测。
         * 对于需要进行颜色混合的物体，在绘制时暂时锁定深度缓冲区，使深度检测失效。从而他们在同一z值上，可以混合颜色。
         * 此时需要手工维护物体的绘制顺序，最靠近屏幕的最后绘制。因为深度检测被暂时失效了
         * 
         */
        if (this.state.depthBufferLocked) {
            gl.depthMask(false)
        } else {
            gl.depthMask(true)
        }

        // 开启混合
        if (this.state.blendEnable) {
            gl.enable(gl.BLEND)
            /**
             * 为要混合的两种颜色，指定各自的比重
             */
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        } else {
            gl.disable(gl.BLEND)
        }

        viewMatrix.setLookAt(eye[0], eye[1], eye[2], 0, 0, 0, 0, 1, 0);


        let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
        let u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
        let u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix')

        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix)
        normalMaytrix.setInverseOf(modelMatrix)
        normalMaytrix.transpose()

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMaytrix.elements);


        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);     // Clear buffers
        gl.drawElements(gl.TRIANGLES, gl.n, gl.UNSIGNED_BYTE, 0);   // Draw
    }
    saveModelMatrix (m) {
        let m2 = new cuon.Matrix4(m)
        this.state.modelMatrixStack.push(m2)
    }
    popModelMatrix () {
        let out =  this.state.modelMatrixStack.pop()
        return out
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
    enableDepthTest(bol) {
        this.setState({
            depthTestEnable: bol
        })
        setTimeout(() => {
            this.rePaint(this.state.gl)
        }, 0);   
    }
    enableBlend (bol) {
        this.setState(produce(draft => {
            draft.blendEnable = bol
        }))
        setTimeout(() => {
            this.rePaint(this.state.gl)
        }, 0)
    }
    toggleDepthBuffer (bol) {
        this.setState(produce(draft => {
            draft.depthBufferLocked = bol
        }))
        setTimeout(() => {
            this.rePaint(this.state.gl)
        }, 0)
    }
    clickHandler(e) {
        return
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
        console.warn(123, pixels)
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
            <div id="7-7" className="webgl contaner">
                <h3 className="title">{this.state.title}</h3>
                <p>深度检测:{this.state.depthTestEnable ? '开启' : '关闭'}
                    <button  onClick={() => this.enableDepthTest(true)}>开启</button><button  onClick={() => this.enableDepthTest(false)}>关闭</button>
                </p>
                <p>深度缓冲区:{this.state.depthBufferLocked ? '锁定' : '解除锁定'}
                    <button  onClick={() => this.toggleDepthBuffer(true)}>锁定</button><button  onClick={() => this.toggleDepthBuffer(false)}>解除锁定</button>
                </p>
                <p>Blend模式:{this.state.blendEnable ? '开启' : '关闭'}
                    <button  onClick={() => this.enableBlend(true)}>开启</button><button  onClick={() => this.enableBlend(false)}>关闭</button>
                </p>
                <canvas className="webgl" width="400" height="400" ref="canvas" onClick={this.clickHandler.bind(this)}></canvas>
            </div>
        );
    }
}