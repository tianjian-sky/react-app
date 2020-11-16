import React from 'react'
import produce from "immer"
import cuon from '../../lib/cuon-matrix'
import OBJDoc from '../../lib/OBJDoc'

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: '7-11 加载模型',
            gl: null,
            glPrograme1: null,
            glObjDoc: null, 
            buffer: {
                vertex: null,
                normal: null,
                text: null,
                indice: null,
                color: null,
            },
            points: [],
            perspective: {
                gNear: 1,
                gFar: 5000,
                fov: 30,
                perspective: 1
            },
            eyeAt: [0.0, 500.0, 200.0],
            lightPosition: {
                x: 0,
                y: 3,
                z: 4
            },
            translation: {
                model1: {
                    translateX: 0,
                    translateY: 0,
                    translateZ: 0,
                    rotateX: 0,
                    rotateY: 0,
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

        const VSHADER_SOURCE = 
        'attribute vec4 a_Position;\n' +
        'attribute vec4 a_Color;\n' +
        'attribute vec4 a_Normal;\n' +
        'uniform mat4 u_MvpMatrix;\n' +
        'uniform mat4 u_NormalMatrix;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  vec3 lightDirection = vec3(-0.35, 0.35, 0.87);\n' +
        '  gl_Position = u_MvpMatrix * a_Position;\n' +
        '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
        '  float nDotL = max(dot(normal, lightDirection), 0.0);\n' +
        '  v_Color = vec4(a_Color.rgb * nDotL, a_Color.a);\n' +
        '}\n';

        // Fragment shader program
        const FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
        '#endif\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';

        
        const program1 = gl.createProgram();
        const vshader1 = this.loadShader(gl, gl.VERTEX_SHADER, VSHADER_SOURCE)
        const fshader1 = this.loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE)


        // 一个 WebGLProgram 对象由两个编译过后的 WebGLShader 组成 - 顶点着色器和片段着色器（均由 GLSL 语言所写）。这些组合成一个可用的 WebGL 着色器程序。
        gl.attachShader(program1, vshader1);
        gl.attachShader(program1, fshader1);

        gl.linkProgram(program1);

        if (!gl.getProgramParameter(program1, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program1);
            throw "Could not compile WebGL program. \n\n" + info;
        }
        this.state.glPrograme1 = program1
        return gl
    }
    initBuffers (gl, objDoc) {
        // 设置顶点

        const drawINFO = objDoc.getDrawingInfo()
        console.warn('obj drawInfo:', drawINFO, this.state.buffer)
        const vertices = drawINFO.vertices
        const colors = drawINFO.colors
        const normals = drawINFO.normals
        const indices = drawINFO.indices


        /**
         * 每个顶点会参与3个面6个三角形绘制，这3个面绘制时都需要计算反射光颜色，需要知道这个面的法向量
         * 所以需要一个法向量的buffer，与顶点一一对应，
         */
    
        let vertixBuffer = gl.createBuffer() // 缓冲区对象
        let indexBuffer = gl.createBuffer()
        let normalBuffer = gl.createBuffer()
        let colorBuffer = gl.createBuffer()

        if (!vertixBuffer || !indexBuffer || !normalBuffer || !colorBuffer) {
            console.warn('缓冲区对象创建失败')
            return -1
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, vertixBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
        vertixBuffer.num = 3
        vertixBuffer.type = gl.FLOAT

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)
        colorBuffer.num = 3
        colorBuffer.type = gl.FLOAT

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW)
        normalBuffer.num = 4
        normalBuffer.type = gl.FLOAT

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)
        indexBuffer.num = 1
        indexBuffer.type = gl.UNSIGNED_BYTE
        gl.n = indices.length

        this.setState(produce(draft => {
            draft.buffer.vertex = vertixBuffer
            draft.buffer.color = colorBuffer
            draft.buffer.normal = normalBuffer
            draft.buffer.indice = indexBuffer
        }))

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
        let a_Color = gl.getAttribLocation(program, 'a_Color')
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.state.buffer.color)
        gl.vertexAttribPointer(a_Color, this.state.buffer.color.num, this.state.buffer.color.type, false, 0, 0)
        gl.enableVertexAttribArray(a_Color)

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
    resetGl (gl) {
        gl.clearColor(0.2, 0.2, 0.2, 1.0);
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
        this.resetGl(gl)
        this.draw1(gl, this.state.glPrograme1)
    }
    componentDidMount() {
        const gl = this.initWebglPrograme()
        
        this.loadOBJFile('/webgl/cube.obj', gl, (resp) => {
            const objDoc = this.getObjDoc(resp, '/webgl/cube.obj', gl, null, 60, true)
            this.initBuffers(gl, objDoc)
            this.rePaint(gl, objDoc)
        })
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
    // Read a file
    loadOBJFile(fileName, gl, cb) {
        var request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status !== 404) {
                cb(request.responseText);
            }
        }
        request.open('GET', fileName, true); // Create a request to acquire the file
        request.send();                      // Send the request
    }
    // OBJ File has been read
    getObjDoc (fileString, fileName, gl, o, scale, reverse) {
        var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
        var result = objDoc.parse(fileString, scale, reverse); // Parse the file
        if (!result) {
            console.log("OBJ file parsing error.");
            return;
        }
        console.log('objDoc:', objDoc)
        this.setState(produce(draft => {
            draft.glObjDoc = objDoc
        }))
        return objDoc
    }
    render() {
        return (
            <div id="7-11" className="webgl contaner">
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
                <canvas className="webgl" width="400" height="400" ref="canvas"></canvas>
            </div>
        );
    }
}