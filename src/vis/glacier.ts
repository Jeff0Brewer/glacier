import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import vertSource from '../shaders/glacier-vert.glsl?raw'
import fragSource from '../shaders/glacier-frag.glsl?raw'

// floats per vertex for attribs
const POS_FPV = 3

class Glacier {
    buffer: WebGLBuffer
    program: WebGLProgram
    bindPosition: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    numVertex: number

    constructor (
        gl: WebGLRenderingContext,
        surface: HTMLImageElement,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4,
        heightScale: number
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        this.buffer = initBuffer(gl)
        const verts = getSurfaceVerts(surface, heightScale)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / POS_FPV

        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0)

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')

        // initialize uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)

        // get closures to easily set uniforms which may change
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindPosition()
        this.setModelMatrix(modelMatrix)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
    }
}

// from width and height, create plane triangle strip with position and tex coordinate attributes
const getSurfaceVerts = (img: HTMLImageElement, heightScale: number): Float32Array => {
    const imgReader = new ImageReader(img)

    // scale down dimensions, don't need a vertex at every image pixel
    const DOWNSAMPLE = 4
    const width = Math.ceil(img.width / DOWNSAMPLE)
    const height = Math.ceil(img.height / DOWNSAMPLE)

    const VERT_PER_POS = 2 // since drawing as triangle strip
    const verts = new Float32Array((width - 1) * height * VERT_PER_POS * POS_FPV)

    let ind = 0

    // helper to set vertex from x, y and height map
    // multiply by downsample to get coords aligned with pixel inds
    const setVert = (x: number, y: number): void => {
        const px = x * DOWNSAMPLE
        const py = y * DOWNSAMPLE
        verts[ind++] = px
        verts[ind++] = py
        verts[ind++] = vec3.length(imgReader.getRGB(px, py)) / 255 * heightScale
    }

    // helper to set single line in plane's triangle strip
    const setStrip = (x: number, y: number): void => {
        setVert(x, y)
        setVert(x + 1, y)
    }

    for (let x = 0; x < width - 1; x++) {
        // alternate y increment direction for each column
        if (x % 2 === 0) {
            for (let y = 0; y < height; y++) {
                setStrip(x, y)
            }
        } else {
            for (let y = height - 1; y >= 0; y--) {
                setStrip(x, y)
            }
        }
    }

    return verts
}

class ImageReader {
    data: Uint8ClampedArray
    width: number
    height: number

    constructor (img: HTMLImageElement) {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) { throw new Error('Failed to get offscreen drawing context') }
        ctx.drawImage(img, 0, 0)

        this.data = ctx.getImageData(0, 0, img.width, img.height).data
        this.width = img.width
        this.height = img.height
    }

    getRGB (x: number, y: number): vec3 {
        const ind = (y * this.width + x) * 4
        return vec3.fromValues(
            this.data[ind],
            this.data[ind + 1],
            this.data[ind + 2]
        )
    }
}

export default Glacier
