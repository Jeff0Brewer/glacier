import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import vertSource from '../shaders/marker-vert.glsl?raw'
import fragSource from '../shaders/marker-frag.glsl?raw'

const markerColors = [
    vec3.fromValues(0.6, 0.2, 0.68),
    vec3.fromValues(0.94, 0.96, 0),
    vec3.fromValues(1, 0.24, 0.78),
    vec3.fromValues(0, 0.79, 0.8),
    vec3.fromValues(0, 0.49, 0.47)
]

type Marker = {
    x: number,
    y: number,
    z: number,
    color: vec3
}

const POS_FPV = 3
const VEL_BOUNDS = 3
const PIN_WIDTH = 1.5
const PIN_HEGIHT = 50
const PIN_DETAIL = 10
const PIN_HEAD_HEIGHT = 6
const PIN_HEAD_WIDTH = 5

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
        const verts = getPinVerts(PIN_DETAIL, PIN_WIDTH, PIN_HEAD_WIDTH)
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
        const height = (clamp(vel[2], -VEL_BOUNDS, VEL_BOUNDS) + VEL_BOUNDS) * 0.1 * PIN_HEGIHT

        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindPosition()
        this.setHeight(height)
        this.setMarkerPos(marker.x, marker.y, marker.z)
        this.setColor(marker.color)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
    }
}

const clamp = (val: number, min: number, max: number): number => {
    return Math.min(Math.max(val, min), max)
}

const getPinVerts = (detail: number, pinRadius: number, headRadius: number): Float32Array => {
    const vert = new Float32Array(detail * POS_FPV * 8)
    let ind = 0
    // helper to set vertices in array sequentially
    const setVert = (x: number, y: number, z: number): void => {
        vert[ind++] = x
        vert[ind++] = y
        vert[ind++] = z
    }

    const zInc = PIN_HEAD_HEIGHT / 2
    const angleInc = 2 * Math.PI / (detail - 1)
    for (let angle = 0; angle <= 2 * Math.PI; angle += angleInc) {
        const x = Math.cos(angle)
        const y = Math.sin(angle)
        const nx = Math.cos(angle + angleInc)
        const ny = Math.sin(angle + angleInc)

        setVert(x * pinRadius, y * pinRadius, 0)
        setVert(nx * pinRadius, ny * pinRadius, 0)
        setVert(x * pinRadius, y * pinRadius, 1)
        setVert(nx * pinRadius, ny * pinRadius, 1)
        setVert(x * headRadius, y * headRadius, 1 + zInc)
        setVert(nx * headRadius, ny * headRadius, 1 + zInc)
        setVert(0, 0, 1 + 2 * zInc)
        setVert(0, 0, 1 + 2 * zInc)
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
