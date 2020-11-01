import React from 'react'
import produce from "immer"
import cuon from '../../lib/cuon-matrix'
import pic from '../../static/orange.jpg';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '7-8 多个着色器',
            gl: null,
            glPrograme1: null,
            glPrograme2: null,
            buffer: {
                vertex: null,
                normal: null,
                text: null,
                indice: null
            },
            points: [],
            perspective: {
                gNear: 1,
                gFar: 100,
                fov: 30,
                perspective: 1
            },
            eyeAt: [0, 0, 15],
            lightPosition: {
                x: 0,
                y: 3,
                z: 4
            },
            translation: {
                model1: {
                    translateX: -2,
                    translateY: 0,
                    translateZ: 0,
                    rotateX: 20,
                    rotateY: 10,
                    rotateZ: 0
                },
                model2: {
                    translateX: 2,
                    translateY: 2,
                    translateZ: 0,
                    rotateX: 0,
                    rotateY: 10,
                    rotateZ: 0
                }
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
    initWebglPrograme () {
        let c = this.refs.canvas
        let gl = c.getContext('webgl')
        this.state.gl = gl

        const SOLID_VSHADER_SOURCE =
        'attribute vec4 a_Position;\n' +
        'attribute vec4 a_Normal;\n' +
        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  vec3 lightDirection = vec3(0.0, 0.0, 1.0);\n' + // Light direction(World coordinate)
      　'  vec4 color = vec4(0.0, 1.0, 1.0, 1.0);\n' +     // Face color
      　'  gl_Position = u_MvpMatrix * a_Position;\n' +
        '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
        '  v_Color = vec4(color.rgb * nDotL, color.a);\n' +
        '}\n';
      const SOLID_FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
        '#endif\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';
      
      // Vertex shader for texture drawing
      const TEXTURE_VSHADER_SOURCE =
        'attribute vec4 a_Position;\n' +
        'attribute vec4 a_Normal;\n' +
        'attribute vec2 a_TexCoord;\n' +
        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'varying float v_NdotL;\n' +
        'varying vec2 v_TexCoord;\n' +
        'void main() {\n' +
        '  vec3 lightDirection = vec3(0.0, 0.0, 1.0);\n' + // Light direction(World coordinate)
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        '  v_NdotL = max(dot(normal, lightDirection), 0.0);\n' +
        '  v_TexCoord = a_TexCoord;\n' +
        '}\n';
      
      // Fragment shader for texture drawing
      const TEXTURE_FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
        '#endif\n' +
        'uniform sampler2D u_Sampler;\n' +
        'varying vec2 v_TexCoord;\n' + // 绘制形状为gl.TRANGLES, 每个面计算分别计算纹理坐标
        'varying float v_NdotL;\n' +
        'void main() {\n' +
        '  vec4 color = texture2D(u_Sampler, v_TexCoord);\n' +
        '  gl_FragColor = vec4(color.rgb * v_NdotL, color.a);\n' +
        '}\n';
        
        const program1 = gl.createProgram();
        const program2 = gl.createProgram();
        const vshader1 = this.loadShader(gl, gl.VERTEX_SHADER, SOLID_VSHADER_SOURCE)
        const fshader1 = this.loadShader(gl, gl.FRAGMENT_SHADER, SOLID_FSHADER_SOURCE)

        const vshader2 = this.loadShader(gl, gl.VERTEX_SHADER, TEXTURE_VSHADER_SOURCE)
        const fshader2 = this.loadShader(gl, gl.FRAGMENT_SHADER, TEXTURE_FSHADER_SOURCE)

        // 一个 WebGLProgram 对象由两个编译过后的 WebGLShader 组成 - 顶点着色器和片段着色器（均由 GLSL 语言所写）。这些组合成一个可用的 WebGL 着色器程序。
        gl.attachShader(program1, vshader1);
        gl.attachShader(program1, fshader1);

        gl.attachShader(program2, vshader2);
        gl.attachShader(program2, fshader2);

        gl.linkProgram(program1);
        gl.linkProgram(program2);

        if (!gl.getProgramParameter(program1, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program1);
            throw "Could not compile WebGL program. \n\n" + info;
        }
        if (!gl.getProgramParameter(program2, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program2);
            throw "Could not compile WebGL program. \n\n" + info;
        }
        this.state.glPrograme1 = program1
        this.state.glPrograme2 = program2
        return gl
    }
    initBuffers (gl) {
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
        const normals = new Float32Array([   // Normal
            0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,     // v0-v1-v2-v3 front
            1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,     // v0-v3-v4-v5 right
            0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,     // v0-v5-v6-v1 up
           -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,     // v1-v6-v7-v2 left
            0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,     // v7-v4-v3-v2 down
            0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0      // v4-v7-v6-v5 back
        ]);
       
        const texCoords = new Float32Array([   // Texture coordinates
            1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
            0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
            1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
            1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
            0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
        ]);

        const indices = new Uint8Array([   // Indices of the vertices
            0, 1, 2,   0, 2, 3,    // front
            4, 5, 6,   4, 6, 7,    // right
            8, 9,10,   8,10,11,    // up
            12,13,14,  12,14,15,    // left
            16,17,18,  16,18,19,    // down
            20,21,22,  20,22,23     // back
        ]);


        /**
         * 每个顶点会参与3个面6个三角形绘制，这3个面绘制时都需要计算反射光颜色，需要知道这个面的法向量
         * 所以需要一个法向量的buffer，与顶点一一对应，
         */
    
        let vertixBuffer = gl.createBuffer() // 缓冲区对象
        let indexBuffer = gl.createBuffer()
        let normalBuffer = gl.createBuffer()
        let textBuffer = gl.createBuffer()
        let colorBuffer = gl.createBuffer()

        if (!vertixBuffer || !indexBuffer || !normalBuffer || !textBuffer || !colorBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }
        const FSIZE = vertices.BYTES_PER_ELEMENT;

        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
        vertixBuffer.num = 3
        vertixBuffer.type = gl.FLOAT
        this.state.buffer.vertex = vertixBuffer

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)
        normalBuffer.num = 3
        normalBuffer.type = gl.FLOAT
        this.state.buffer.normal = normalBuffer

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
        indexBuffer.num = 1
        indexBuffer.type = gl.UNSIGNED_BYTE
        this.state.buffer.indice = indexBuffer

        gl.bindBuffer(gl.ARRAY_BUFFER, textBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW)
        textBuffer.num = 2
        textBuffer.type = gl.FLOAT
        this.state.buffer.text = textBuffer
        gl.n = indices.length
    }
    initTexture (gl, program, img) {
        let texture = gl.createTexture()
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1) // 图像预处理
        gl.activeTexture(gl.TEXTURE0) // 需要激活的纹理单元。其值是 gl.TEXTUREI ，其中的 I 在 0 到 gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS - 1 范围内。
        gl.bindTexture(gl.TEXTURE_2D, texture) // 将给定的 WebGLTexture 绑定到目标（绑定点）
        
        let u_Sampler = gl.getUniformLocation(program, 'u_Sampler')
        gl.uniform1i(u_Sampler, 0)
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR) // 设置纹理参数 float
        // gl.texParameteri() // 设置纹理参数 int
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    }
    draw1(gl, program) {
        gl.useProgram(program);   // Tell that this program object is used

        let a_Position = gl.getAttribLocation(program, 'a_Position')
        let a_Normal = gl.getAttribLocation(program, 'a_Normal')
        let u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix')
        let u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix')

        let projMatrix = new cuon.Matrix4() // 投影矩阵 1.根据三角形与视点的距离对三角形进行缩小， 2.对三角形进行平移（近大远小，透视法），3.定义可视空间
        let viewMatrix = new cuon.Matrix4() // 视图矩阵 改变视线
        let modelMatrix = new cuon.Matrix4() // 模型矩阵，同一组顶点多次便宜，叠加绘制
        let mvpMatrix = new cuon.Matrix4() // 模型视图投影矩阵 = 投影矩阵 x 视图矩阵 x 模型矩阵
        let normalMaytrix = new cuon.Matrix4() // 模型矩阵的逆转置矩阵 x 原法向量 = 变换后的法向量


        modelMatrix.setTranslate(this.state.translation.model1.translateX, 0.0, 0.0);
        modelMatrix.rotate(this.state.translation.model1.rotateX, 1.0, 0.0, 0.0);
        modelMatrix.rotate(this.state.translation.model1.rotateY, 0.0, 1.0, 0.0);

        projMatrix.setPerspective(this.state.perspective.fov, this.state.perspective.perspective, this.state.perspective.gNear, this.state.perspective.gFar)
        viewMatrix.lookAt(...this.state.eyeAt, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix)

        normalMaytrix.setInverseOf(modelMatrix)
        normalMaytrix.transpose()

        // 激活变量前 先要绑定buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.state.buffer.vertex)
        gl.vertexAttribPointer(a_Position, this.state.buffer.vertex.num, this.state.buffer.vertex.type, false, 0, 0)
        gl.enableVertexAttribArray(a_Position)

        // 激活变量前 先要绑定buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.state.buffer.normal)
        gl.vertexAttribPointer(a_Normal, this.state.buffer.normal.num, this.state.buffer.normal.type, false, 0, 0)
        gl.enableVertexAttribArray(a_Normal)

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements)
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMaytrix.elements)

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.state.buffer.indice)
        /**
         * void gl.drawElements(mode, count, type, offset);
         * 
         * mode: 指定要渲染的图元类型
         * count:指定要渲染的元素数量.
         * type:指定元素数组缓冲区中的值的类型
         * offset:指定元素数组缓冲区中的偏移量
         */
        gl.drawElements(gl.TRIANGLES, gl.n, gl.UNSIGNED_BYTE, 0)
    }
    draw2(gl, program, img) {
        gl.useProgram(program)
        this.initTexture(gl, program, img)
            // Tell that this program object is used

        let a_Position = gl.getAttribLocation(program, 'a_Position')
        let a_Normal = gl.getAttribLocation(program, 'a_Normal')
        let a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord')
        let u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix')
        let u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix')

        let projMatrix = new cuon.Matrix4() // 投影矩阵 1.根据三角形与视点的距离对三角形进行缩小， 2.对三角形进行平移（近大远小，透视法），3.定义可视空间
        let viewMatrix = new cuon.Matrix4() // 视图矩阵 改变视线
        let modelMatrix = new cuon.Matrix4() // 模型矩阵，同一组顶点多次便宜，叠加绘制
        let mvpMatrix = new cuon.Matrix4() // 模型视图投影矩阵 = 投影矩阵 x 视图矩阵 x 模型矩阵
        let normalMaytrix = new cuon.Matrix4() // 模型矩阵的逆转置矩阵 x 原法向量 = 变换后的法向量


        modelMatrix.setTranslate(this.state.translation.model2.translateX, 0.0, 0.0);
        modelMatrix.rotate(this.state.translation.model2.rotateX, 1.0, 0.0, 0.0);
        modelMatrix.rotate(this.state.translation.model2.rotateY, 0.0, 1.0, 0.0);

        projMatrix.setPerspective(this.state.perspective.fov, this.state.perspective.perspective, this.state.perspective.gNear, this.state.perspective.gFar)
        viewMatrix.lookAt(...this.state.eyeAt, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
        mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix)

        normalMaytrix.setInverseOf(modelMatrix)
        normalMaytrix.transpose()

        // 激活变量前 先要绑定buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.state.buffer.vertex)
        gl.vertexAttribPointer(a_Position, this.state.buffer.vertex.num, this.state.buffer.vertex.type, false, 0, 0)
        gl.enableVertexAttribArray(a_Position)

        // 激活变量前 先要绑定buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.state.buffer.normal)
        gl.vertexAttribPointer(a_Normal, this.state.buffer.normal.num, this.state.buffer.normal.type, false, 0, 0)
        gl.enableVertexAttribArray(a_Normal)

        // 激活变量前 先要绑定buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.state.buffer.text)
        gl.vertexAttribPointer(a_TexCoord, this.state.buffer.text.num, this.state.buffer.text.type, false, 0, 0)
        gl.enableVertexAttribArray(a_TexCoord)

        gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements)
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMaytrix.elements)


        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.state.buffer.indice)
        /**
         * void gl.drawElements(mode, count, type, offset);
         * 
         * mode: 指定要渲染的图元类型
         * count:指定要渲染的元素数量.
         * type:指定元素数组缓冲区中的值的类型
         * offset:指定元素数组缓冲区中的偏移量
         */
        gl.drawElements(gl.TRIANGLES, gl.n, gl.UNSIGNED_BYTE, 0)
    }
    resetGl (gl) {
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
    rePaint (gl) {
        let img = new Image()
        img.onload = () => {
            this.resetGl(gl)
            this.draw1(gl, this.state.glPrograme1)
            this.draw2(gl, this.state.glPrograme2, img)
        }
        img.src = pic
    }
    componentDidMount() {
        const gl = this.initWebglPrograme()
        this.initBuffers(gl)
        this.rePaint(gl)
        // document.body.addEventListener('keydown', this.listenKeyDown.bind(this))
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
                <p><img src={pic}/></p>
                <canvas className="webgl" width="400" height="400" ref="canvas"></canvas>
            </div>
        );
    }
}