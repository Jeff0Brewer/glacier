import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import vertSource from '../shaders/marker-vert.glsl?raw'
import fragSource from '../shaders/marker-frag.glsl?raw'

const markerColors = [
    vec3.fromValues(0, 0, 1),
    vec3.fromValues(0, 0.7, 0),
    vec3.fromValues(1, 0, 1),
    vec3.fromValues(1, 0, 0)
]

type Marker = {
    x: number,
    y: number,
    z: number,
    color: vec3
}

const POS_FPV = 3
const MARKER_HEIGHT = 50

class Markers {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindPosition: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setHeight: (val: number) => void
    setColor: (color: vec3) => void
    setMarkerPos: (x: number, y: number, z: number) => void
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
        const verts = getCylVerts(20, 3)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / POS_FPV
        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0)

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        const uHeight = gl.getUniformLocation(this.program, 'height')
        const uColor = gl.getUniformLocation(this.program, 'color')
        const uMarkerPos = gl.getUniformLocation(this.program, 'markerPos')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setHeight = (val: number): void => { gl.uniform1f(uHeight, val) }
        this.setColor = (color: vec3): void => { gl.uniform3fv(uColor, color) }
        this.setMarkerPos = (x: number, y: number, z: number): void => {
            gl.uniform3f(uMarkerPos, x, y, z)
        }
    }

    draw (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number, marker: Marker): void {
        const vel = calcFlowVelocity(data, options, marker.y, marker.x, time)
        const height = (clamp(vel[2], -5.0, 5.0) + 5.0) * 0.1 * MARKER_HEIGHT

        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindPosition()
        this.setMarkerPos(marker.x, marker.y, marker.z)
        this.setHeight(height)
        this.setColor(marker.color)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
    }
}

const clamp = (val: number, min: number, max: number): number => {
    return Math.min(Math.max(val, min), max)
}

const getCylVerts = (detail: number, radius: number): Float32Array => {
    const vert = new Float32Array(detail * POS_FPV * 2)
    let ind = 0
    const angleInc = 2 * Math.PI / (detail - 1)
    for (let angle = 0; angle <= 2 * Math.PI; angle += angleInc) {
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        vert[ind++] = x
        vert[ind++] = y
        vert[ind++] = 0
        vert[ind++] = x
        vert[ind++] = y
        vert[ind++] = 1
    }
    return vert
}

export default Markers

export {
    markerColors
}

export type {
    Marker
}
