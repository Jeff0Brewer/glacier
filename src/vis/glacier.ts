import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute, initTexture } from '../lib/gl-wrap'
import vertSource from '../shaders/glacier-vert.glsl?raw'
import fragSource from '../shaders/glacier-frag.glsl?raw'

// floats per vertex for attribs
const POS_FPV = 2

class Glacier {
    buffer: WebGLBuffer
    texture: WebGLTexture
    program: WebGLProgram
    numVertex: number
    bindPosition: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setScaleMatrix: (mat: mat4) => void
    setDimensions: (width: number, height: number) => void

    constructor (gl: WebGLRenderingContext) {
        this.program = initProgram(gl, vertSource, fragSource)
        this.buffer = initBuffer(gl)
        this.texture = initTexture(gl)
        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0)
        this.numVertex = 0

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        this.setModelMatrix = (mat: mat4): void => {
            gl.uniformMatrix4fv(uModelMatrix, false, mat)
        }
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        this.setViewMatrix = (mat: mat4): void => {
            gl.uniformMatrix4fv(uViewMatrix, false, mat)
        }
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        this.setProjMatrix = (mat: mat4): void => {
            gl.uniformMatrix4fv(uProjMatrix, false, mat)
        }
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        this.setScaleMatrix = (mat: mat4): void => {
            gl.uniformMatrix4fv(uScaleMatrix, false, mat)
        }
        const uDimensions = gl.getUniformLocation(this.program, 'dimensions')
        this.setDimensions = (width: number, height: number): void => {
            gl.uniform2f(uDimensions, width, height)
        }
    }

    setSurface (gl: WebGLRenderingContext, image: HTMLImageElement): void {
        // set texture from image data
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        )
        // set vertices from image size
        const plane = getPlaneVerts(image.width, image.height)
        this.numVertex = plane.length / POS_FPV
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, plane, gl.STATIC_DRAW)
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        this.bindPosition()
        this.setModelMatrix(modelMatrix)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
    }
}

// from width and height, create plane triangle strip with position and tex coordinate attributes
const getPlaneVerts = (width: number, height: number): Float32Array => {
    // scale down dimensions, don't need a vertex at every image pixel
    const DOWNSAMPLE = 4
    width = Math.ceil(width / DOWNSAMPLE)
    height = Math.ceil(height / DOWNSAMPLE)

    const VERT_PER_POS = 2 // since drawing as triangle strip
    const verts = new Float32Array((width - 1) * height * VERT_PER_POS * POS_FPV)

    let ind = 0
    // helper to set single line in plane's triangle strip
    // multiply by downsample to get coords aligned with pixel inds
    const setStrip = (x: number, y: number): void => {
        verts[ind++] = x * DOWNSAMPLE
        verts[ind++] = y * DOWNSAMPLE
        verts[ind++] = (x + 1) * DOWNSAMPLE
        verts[ind++] = y * DOWNSAMPLE
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

export default Glacier
