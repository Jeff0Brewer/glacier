import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute, initTexture } from '../lib/gl-wrap'
import vertSource from '../shaders/glacier-vert.glsl?raw'
import fragSource from '../shaders/glacier-frag.glsl?raw'

const POS_FPV = 2
const TEX_FPV = 2
const ALL_FPV = POS_FPV + TEX_FPV

class Glacier {
    buffer: WebGLBuffer
    texture: WebGLTexture
    program: WebGLProgram
    numVertex: number
    bindPosition: () => void
    bindTexCoord: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void

    constructor (gl: WebGLRenderingContext) {
        const plane = getPlaneVerts(1027, 1820)
        this.numVertex = plane.length / ALL_FPV
        this.buffer = initBuffer(gl, plane, gl.STATIC_DRAW)

        this.texture = initTexture(gl, './data/bedmap2_surface_rutford.png')

        this.program = initProgram(gl, vertSource, fragSource)

        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        this.bindTexCoord = initAttribute(gl, this.program, 'texCoord', TEX_FPV, ALL_FPV, POS_FPV)

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
    }

    draw (gl: WebGLRenderingContext): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        this.bindPosition()
        this.bindTexCoord()
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
    }
}

const getPlaneVerts = (width: number, height: number): Float32Array => {
    const VERT_PER_POS = 2
    const verts = new Float32Array((width - 1) * height * VERT_PER_POS * ALL_FPV)

    let ind = 0
    const texScaleX = 1 / (width - 1)
    const texScaleY = 1 / (height - 1)
    const avgDim = (width + height) / 2
    const posScale = 1 / (avgDim)
    const posOffset = -avgDim / 2

    // helper to set swizzled attribs from xy position
    const setVert = (x: number, y: number): void => {
        verts[ind++] = (x + posOffset) * posScale
        verts[ind++] = (y + posOffset) * posScale
        verts[ind++] = x * texScaleX
        verts[ind++] = y * texScaleY
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

export default Glacier
