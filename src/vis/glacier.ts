import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import vertSource from '../shaders/vert.glsl?raw'
import fragSource from '../shaders/frag.glsl?raw'

class Glacier {
    program: WebGLProgram
    buffer: WebGLBuffer
    numVertex: number
    bindPosition: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void

    constructor (gl: WebGLRenderingContext) {
        const posFpv = 3 // floats per position vertex
        const plane = getPlaneVerts(11, 11)
        this.numVertex = plane.length / posFpv
        this.buffer = initBuffer(gl, plane, gl.STATIC_DRAW)

        this.program = initProgram(gl, vertSource, fragSource)

        this.bindPosition = initAttribute(gl, this.program, 'position', posFpv, posFpv, 0)

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
        this.bindPosition()
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
    }
}

const getPlaneVerts = (width: number, height: number): Float32Array => {
    const verts = new Float32Array((width - 1) * height * 6)

    // helper to set single line in plane's triangle strip
    let ind = 0
    const setStrip = (x: number, y: number, z: number): void => {
        verts[ind++] = x
        verts[ind++] = y
        verts[ind++] = z
        verts[ind++] = x + 1
        verts[ind++] = y
        verts[ind++] = z
    }

    for (let x = 0; x < width - 1; x++) {
        // alternate y increment direction for each column
        if (x % 2 === 0) {
            for (let y = 0; y < height; y++) {
                setStrip(x, y, 0)
            }
        } else {
            for (let y = height - 1; y >= 0; y--) {
                setStrip(x, y, 0)
            }
        }
    }

    return verts
}

export default Glacier
