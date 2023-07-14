import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getIcosphere } from '../lib/icosphere'
import type { Marker } from '../vis/markers'
import vertSource from '../shaders/marker-vert.glsl?raw'
import fragSource from '../shaders/marker-frag.glsl?raw'

const POS_FPV = 3
const NRM_FPV = 3
const COL_FPV = 3
const ALL_FPV = POS_FPV + NRM_FPV + COL_FPV

const VEL_BOUNDS = 3
const PIN_WIDTH = 0.25
const PIN_HEIGHT = 50
const PIN_DETAIL = 10
const BALLOON_WIDTH = 6
const BALLOON_HEIGHT = 8

class MarkerPin {
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

    bind (gl: WebGLRenderingContext): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindAttrib()
    }

    draw (gl: WebGLRenderingContext, marker: Marker, vel: vec3): void {
        const height = (clamp(vel[2], -VEL_BOUNDS, VEL_BOUNDS) + VEL_BOUNDS) * 0.1 * PIN_HEIGHT
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
    const topZ = 5

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

export default MarkerPin
