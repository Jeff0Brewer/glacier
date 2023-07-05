import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import pointVertSource from '../shaders/marker-point-vert.glsl?raw'
import pointFragSource from '../shaders/marker-point-frag.glsl?raw'
import lineVertSource from '../shaders/marker-line-vert.glsl?raw'
import lineFragSource from '../shaders/marker-line-frag.glsl?raw'

type Marker = {
    x: number,
    y: number,
    z: number
}

const POS_FPV = 3

const LINE_HEIGHT = 25
const MAX_VEL = 5

class Markers {
    pointProgram: WebGLProgram
    lineProgram: WebGLProgram
    pointBuffer: WebGLBuffer
    lineBuffer: WebGLBuffer
    pointBindPosition: () => void
    lineBindPosition: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    points: Float32Array
    lines: Float32Array

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4
    ) {
        this.pointProgram = initProgram(gl, pointVertSource, pointFragSource)
        this.lineProgram = initProgram(gl, lineVertSource, lineFragSource)
        this.pointBuffer = initBuffer(gl)
        this.lineBuffer = initBuffer(gl)
        this.pointBindPosition = initAttribute(gl, this.pointProgram, 'position', POS_FPV, POS_FPV, 0)
        this.lineBindPosition = initAttribute(gl, this.lineProgram, 'position', POS_FPV, POS_FPV, 0)
        this.points = new Float32Array()
        this.lines = new Float32Array()

        const uPointModelMatrix = gl.getUniformLocation(this.pointProgram, 'modelMatrix')
        const uPointViewMatrix = gl.getUniformLocation(this.pointProgram, 'viewMatrix')
        const uPointProjMatrix = gl.getUniformLocation(this.pointProgram, 'projMatrix')
        const uPointScaleMatrix = gl.getUniformLocation(this.pointProgram, 'scaleMatrix')
        const uLineModelMatrix = gl.getUniformLocation(this.lineProgram, 'modelMatrix')
        const uLineViewMatrix = gl.getUniformLocation(this.lineProgram, 'viewMatrix')
        const uLineProjMatrix = gl.getUniformLocation(this.lineProgram, 'projMatrix')
        const uLineScaleMatrix = gl.getUniformLocation(this.lineProgram, 'scaleMatrix')

        gl.useProgram(this.pointProgram)
        gl.uniformMatrix4fv(uPointModelMatrix, false, model)
        gl.uniformMatrix4fv(uPointViewMatrix, false, view)
        gl.uniformMatrix4fv(uPointProjMatrix, false, proj)
        gl.uniformMatrix4fv(uPointScaleMatrix, false, scale)

        gl.useProgram(this.lineProgram)
        gl.uniformMatrix4fv(uLineModelMatrix, false, model)
        gl.uniformMatrix4fv(uLineViewMatrix, false, view)
        gl.uniformMatrix4fv(uLineProjMatrix, false, proj)
        gl.uniformMatrix4fv(uLineScaleMatrix, false, scale)

        this.setModelMatrix = (mat: mat4): void => {
            gl.useProgram(this.pointProgram)
            gl.uniformMatrix4fv(uPointModelMatrix, false, mat)
            gl.useProgram(this.lineProgram)
            gl.uniformMatrix4fv(uLineModelMatrix, false, mat)
        }
        this.setViewMatrix = (mat: mat4): void => {
            gl.useProgram(this.pointProgram)
            gl.uniformMatrix4fv(uPointViewMatrix, false, mat)
            gl.useProgram(this.lineProgram)
            gl.uniformMatrix4fv(uLineViewMatrix, false, mat)
        }
        this.setProjMatrix = (mat: mat4): void => {
            gl.useProgram(this.pointProgram)
            gl.uniformMatrix4fv(uPointProjMatrix, false, mat)
            gl.useProgram(this.lineProgram)
            gl.uniformMatrix4fv(uLineProjMatrix, false, mat)
        }
    }

    addMarker (gl: WebGLRenderingContext, pos: vec3): Marker {
        const newPoints = new Float32Array(this.points.length + POS_FPV)
        newPoints.set(this.points)
        newPoints.set(pos, this.points.length)
        this.points = newPoints
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.points, gl.DYNAMIC_DRAW)

        const newLines = new Float32Array(this.lines.length + POS_FPV * 2)
        newLines.set(this.lines)
        newLines.set(pos, this.lines.length)
        const lineTop = vec3.clone(pos)
        lineTop[2] += LINE_HEIGHT
        newLines.set(lineTop, this.lines.length + POS_FPV)
        this.lines = newLines
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.lines, gl.STATIC_DRAW)

        return {
            x: pos[0],
            y: pos[1],
            z: pos[2]
        }
    }

    update (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number): void {
        for (let i = 0; i < this.points.length; i += POS_FPV) {
            const x = this.points[i]
            const y = this.points[i + 1]
            const velocity = calcFlowVelocity(data, options, y, x, time)
            const bottomZ = this.lines[i * 2 + 2]
            const velZClamped = clampSymmetric(velocity[2], MAX_VEL)
            this.points[i + 2] = bottomZ + velZClamped * LINE_HEIGHT
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.points, gl.DYNAMIC_DRAW)
    }

    draw (gl: WebGLRenderingContext, model: mat4): void {
        this.setModelMatrix(model)

        gl.useProgram(this.pointProgram)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer)
        this.pointBindPosition()
        gl.drawArrays(gl.POINTS, 0, this.points.length / POS_FPV)

        gl.useProgram(this.lineProgram)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer)
        this.lineBindPosition()
        gl.drawArrays(gl.LINES, 0, this.lines.length / POS_FPV)
    }
}

const clampSymmetric = (val: number, max: number): number => {
    return (Math.min(Math.max(val, -max), max) + max) / (2 * max)
}

export default Markers

export type {
    Marker
}
