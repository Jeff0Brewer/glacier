import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import vertSource from '../shaders/marker-vert.glsl?raw'
import fragSource from '../shaders/marker-frag.glsl?raw'

type Marker = {
    x: number,
    y: number,
    z: number
}

const POS_FPV = 3

class Markers {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindPosition: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    verts: Float32Array
    numVertex: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4
    ) {
        this.program = initProgram(gl, vertSource, fragSource)
        this.buffer = initBuffer(gl)
        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0)
        this.verts = new Float32Array()
        this.numVertex = 0

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
    }

    addMarker (gl: WebGLRenderingContext, pos: vec3): Marker {
        const newVerts = new Float32Array(this.verts.length + POS_FPV)
        newVerts.set(this.verts)
        newVerts.set(pos, this.verts.length)
        this.verts = newVerts
        this.numVertex = newVerts.length / POS_FPV
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.verts, gl.STATIC_DRAW)
        return {
            x: pos[0],
            y: pos[1],
            z: pos[2]
        }
    }

    draw (gl: WebGLRenderingContext, model: mat4): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindPosition()
        this.setModelMatrix(model)
        gl.drawArrays(gl.POINTS, 0, this.numVertex)
    }
}

export default Markers

export type {
    Marker
}
