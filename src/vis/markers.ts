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
const NRM_FPV = 3
const COL_FPV = 3
const ALL_FPV = POS_FPV + NRM_FPV + COL_FPV

const VEL_BOUNDS = 3
const PIN_WIDTH = 0.5
const PIN_HEIGHT = 50
const PIN_DETAIL = 10
const BALLOON_WIDTH = 6
const BALLOON_HEIGHT = 8

class Markers {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setHeight: (val: number) => void
    setAccent: (color: vec3) => void
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
        const verts = getPinVerts(PIN_DETAIL, PIN_WIDTH, BALLOON_WIDTH, BALLOON_HEIGHT)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / ALL_FPV

        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        const bindNormal = initAttribute(gl, this.program, 'normal', NRM_FPV, ALL_FPV, POS_FPV)
        const bindColor = initAttribute(gl, this.program, 'color', COL_FPV, ALL_FPV, POS_FPV + NRM_FPV)
        this.bindAttrib = (): void => {
            bindPosition()
            bindNormal()
            bindColor()
        }

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        const uHeight = gl.getUniformLocation(this.program, 'height')
        const uAccent = gl.getUniformLocation(this.program, 'accent')
        const uMarkerPos = gl.getUniformLocation(this.program, 'markerPos')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setHeight = (val: number): void => { gl.uniform1f(uHeight, val) }
        this.setAccent = (color: vec3): void => { gl.uniform3fv(uAccent, color) }
        this.setMarkerPos = (x: number, y: number, z: number): void => {
            gl.uniform3f(uMarkerPos, x, y, z)
        }
    }

    draw (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number, marker: Marker): void {
        const vel = calcFlowVelocity(data, options, marker.y, marker.x, time)
        const height = (clamp(vel[2], -VEL_BOUNDS, VEL_BOUNDS) + VEL_BOUNDS) * 0.1 * PIN_HEIGHT

        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindAttrib()
        this.setHeight(height)
        this.setMarkerPos(marker.x, marker.y, marker.z)
        this.setAccent(marker.color)
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertex)
    }
}

const clamp = (val: number, min: number, max: number): number => {
    return Math.min(Math.max(val, min), max)
}

const ballonWidth = (z: number): number => {
    return (4 - Math.pow((Math.pow((1 - z) * 64, 0.3333) - 2), 2)) * 0.25
}

const getPinVerts = (detail: number, pinWidth: number, headWidth: number, headHeight: number): Float32Array => {
    const ico = getIcosphere(2)
    const topZ = 3

    const vert = new Float32Array(detail * ALL_FPV * 6 + ico.triangles.length * 3 * ALL_FPV)
    let ind = 0
    const setVert = (
        x: number, y: number, z: number,
        nx: number, ny: number, nz: number,
        cr: number, cg: number, cb: number
    ): void => {
        vert[ind++] = x
        vert[ind++] = y
        vert[ind++] = z
        vert[ind++] = nx
        vert[ind++] = ny
        vert[ind++] = nz
        vert[ind++] = cr
        vert[ind++] = cg
        vert[ind++] = cb
    }

    const angleInc = 2 * Math.PI / (detail - 1)
    for (let angle = 0; angle <= 2 * Math.PI; angle += angleInc) {
        const ax = Math.cos(angle)
        const ay = Math.sin(angle)
        const anx = Math.cos(angle + angleInc)
        const any = Math.sin(angle + angleInc)
        const x = ax * pinWidth
        const y = ay * pinWidth
        const nx = anx * pinWidth
        const ny = any * pinWidth
        setVert(x, y, 0, ax, ay, 0, 0, 0, 0)
        setVert(nx, ny, 0, anx, any, 0, 0, 0, 0)
        setVert(x, y, topZ, ax, ay, 0, 0, 0, 0)
        setVert(x, y, topZ, ax, ay, 0, 0, 0, 0)
        setVert(nx, ny, 0, anx, any, 0, 0, 0, 0)
        setVert(nx, ny, topZ, anx, any, 0, 0, 0, 0)
    }

    const headZ = topZ - BALLOON_HEIGHT * 0.5
    for (let ti = 0; ti < ico.triangles.length; ti++) {
        for (let vi = 0; vi < 3; vi++) {
            const [x, y, z] = ico.vertices[ico.triangles[ti][vi]]
            const w = ballonWidth((z + 1) * 0.5)
            setVert(
                x * headWidth * w,
                y * headWidth * w,
                (z + 1) * headHeight + headZ,
                x,
                y,
                z,
                1,
                0,
                1
            )
        }
    }

    return vert
}

// base icosphere definition, 20 sides
// to be subdivided for different levels of detail
const ICO_HYP = (1 + Math.sqrt(5)) / 2
const ICO_BASE_VERT: Array<vec3> = [
    vec3.fromValues(-1, ICO_HYP, 0),
    vec3.fromValues(1, ICO_HYP, 0),
    vec3.fromValues(-1, -ICO_HYP, 0),
    vec3.fromValues(1, -ICO_HYP, 0),
    vec3.fromValues(0, -1, ICO_HYP),
    vec3.fromValues(0, 1, ICO_HYP),
    vec3.fromValues(0, -1, -ICO_HYP),
    vec3.fromValues(0, 1, -ICO_HYP),
    vec3.fromValues(ICO_HYP, 0, -1),
    vec3.fromValues(ICO_HYP, 0, 1),
    vec3.fromValues(-ICO_HYP, 0, -1),
    vec3.fromValues(-ICO_HYP, 0, 1)
].map(v => vec3.normalize(v, v))
const ICO_BASE_TRI: Array<vec3> = [
    vec3.fromValues(0, 11, 5),
    vec3.fromValues(0, 5, 1),
    vec3.fromValues(0, 1, 7),
    vec3.fromValues(0, 7, 10),
    vec3.fromValues(0, 10, 11),
    vec3.fromValues(1, 5, 9),
    vec3.fromValues(5, 11, 4),
    vec3.fromValues(11, 10, 2),
    vec3.fromValues(10, 7, 6),
    vec3.fromValues(7, 1, 8),
    vec3.fromValues(3, 9, 4),
    vec3.fromValues(3, 4, 2),
    vec3.fromValues(3, 2, 6),
    vec3.fromValues(3, 6, 8),
    vec3.fromValues(3, 8, 9),
    vec3.fromValues(4, 9, 5),
    vec3.fromValues(2, 4, 11),
    vec3.fromValues(6, 2, 10),
    vec3.fromValues(8, 6, 7),
    vec3.fromValues(9, 8, 1)
]

const midpoint = (a: vec3, b: vec3): vec3 => {
    const mid = vec3.create()
    vec3.add(mid, a, b)
    vec3.scale(mid, mid, 0.5)
    return mid
}

type Icosphere = {
    triangles: Array<vec3>,
    vertices: Array<vec3>
}

const getIcosphere = (iterations: number): Icosphere => {
    let vert = ICO_BASE_VERT
    let tris = ICO_BASE_TRI

    // subdivide icosphere for given iterations
    for (let iteration = 0; iteration < iterations; iteration++) {
        const nextVert: Array<vec3> = []
        const nextTris: Array<vec3> = []
        for (let ti = 0; ti < tris.length; ti++) {
            // get triangle verts
            const v0 = vert[tris[ti][0]]
            const v1 = vert[tris[ti][1]]
            const v2 = vert[tris[ti][2]]

            // calculate new verts from normalized midpoint between edges
            const v3 = midpoint(v0, v1)
            vec3.normalize(v3, v3)
            const v4 = midpoint(v1, v2)
            vec3.normalize(v4, v4)
            const v5 = midpoint(v2, v0)
            vec3.normalize(v5, v5)

            // convert triangle to 4 new
            const i = nextVert.length
            nextVert.push(v0, v1, v2, v3, v4, v5)
            nextTris.push(
                vec3.fromValues(i + 0, i + 3, i + 5),
                vec3.fromValues(i + 3, i + 1, i + 4),
                vec3.fromValues(i + 4, i + 2, i + 5),
                vec3.fromValues(i + 3, i + 4, i + 5)
            )
        }
        vert = nextVert
        tris = nextTris
    }

    return { triangles: tris, vertices: vert }
}

export default Markers

export {
    markerColors
}

export type {
    Marker
}
