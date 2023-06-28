import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute, initTexture } from '../lib/gl-wrap'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import vertSource from '../shaders/worms-vert.glsl?raw'
import fragSource from '../shaders/worms-frag.glsl?raw'

const WORM_SPEED = 15
const FLOW_OPTIONS_ENABLED: FlowOptions = {
    vel: true,
    p1: true,
    p2: true,
    p3: true
}
// floats per vertex for attribs
const POS_FPV = 3
const SEG_FPV = 1
const ALL_FPV = POS_FPV + SEG_FPV

// ring buffer for drawing trails
class RingSubBuffer {
    length: number
    curr: number
    buffer: WebGLBuffer

    constructor (gl: WebGLRenderingContext, length: number) {
        this.length = length
        this.curr = 0
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(length), gl.DYNAMIC_DRAW)
    }

    // update buffer at current offset, wrap back to start if more vals than remaining length
    set (gl: WebGLRenderingContext, vals: Float32Array): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        const wrapLength = this.length - this.curr
        if (vals.length < wrapLength) {
            gl.bufferSubData(gl.ARRAY_BUFFER, this.curr * vals.BYTES_PER_ELEMENT, vals)
            this.curr += vals.length
        } else {
            const wrap = vals.slice(0, wrapLength)
            gl.bufferSubData(gl.ARRAY_BUFFER, this.curr * vals.BYTES_PER_ELEMENT, wrap)
            this.curr = 0
            this.set(gl, vals.slice(wrapLength))
        }
    }
}

class Worm {
    x: number
    y: number
    z: number
    history: number
    currSegment: number
    time: number
    numVertex: number
    ringBuffer: RingSubBuffer

    constructor (
        gl: WebGLRenderingContext,
        history: number,
        x: number,
        y: number
    ) {
        this.history = history
        this.x = x
        this.y = y
        this.z = 0
        this.currSegment = 0
        this.time = 0
        this.numVertex = history * 2
        this.ringBuffer = new RingSubBuffer(gl, this.numVertex * ALL_FPV)
    }

    update (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number): void {
        const deltaTime = time - this.time
        this.time = time

        // prevent updates after freezes
        if (deltaTime > 1) { return }

        const velocity = calcFlowVelocity(data, options, this.y, this.x, time)
        const lastX = this.x
        const lastY = this.y
        const lastZ = this.z
        this.x += velocity[0] * deltaTime * WORM_SPEED
        this.y -= velocity[1] * deltaTime * WORM_SPEED
        this.z += velocity[2] * deltaTime * WORM_SPEED

        const lastSegment = this.currSegment
        this.currSegment += 1
        const line = new Float32Array([
            lastX,
            lastY,
            lastZ,
            lastSegment,
            this.x,
            this.y,
            this.z,
            this.currSegment
        ])

        this.ringBuffer.set(gl, line)
    }

    draw (
        gl: WebGLRenderingContext,
        bindPosition: () => void,
        bindSegment: () => void,
        setCurrSegment: (ind: number) => void
    ): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ringBuffer.buffer)
        bindPosition()
        bindSegment()
        setCurrSegment(this.currSegment)
        gl.drawArrays(gl.LINES, 0, this.numVertex)
    }
}

class Worms {
    worms: Array<Worm>
    program: WebGLProgram
    texture: WebGLTexture
    bindPosition: () => void
    bindSegment: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setScaleMatrix: (mat: mat4) => void
    setDimensions: (width: number, height: number) => void
    setHeightScale: (scale: number) => void
    setHistory: (history: number) => void
    setCurrSegment: (ind: number) => void

    constructor (
        gl: WebGLRenderingContext,
        data: ModelData,
        surface: HTMLImageElement,
        width: number,
        height: number,
        density: number,
        history: number
    ) {
        this.worms = []
        for (let x = 0; x < width; x += 1 / density) {
            for (let y = 0; y < height; y += 1 / density) {
                const vel = calcFlowVelocity(data, FLOW_OPTIONS_ENABLED, y, x, 0)
                if (vec3.length(vel) !== 0) {
                    this.worms.push(new Worm(gl, history, x, y))
                }
            }
        }

        this.program = initProgram(gl, vertSource, fragSource)
        // set height map from image data
        this.texture = initTexture(gl)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            surface
        )

        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        this.bindSegment = initAttribute(gl, this.program, 'segment', SEG_FPV, ALL_FPV, POS_FPV)

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
        const uHeightScale = gl.getUniformLocation(this.program, 'heightScale')
        this.setHeightScale = (scale: number): void => {
            gl.uniform1f(uHeightScale, scale)
        }
        const uHistory = gl.getUniformLocation(this.program, 'history')
        this.setHistory = (scale: number): void => {
            gl.uniform1f(uHistory, scale)
        }
        const uCurrSegment = gl.getUniformLocation(this.program, 'currSegment')
        this.setCurrSegment = (scale: number): void => {
            gl.uniform1f(uCurrSegment, scale)
        }
        this.setHistory(history)
    }

    update (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number): void {
        for (const worm of this.worms) {
            worm.update(gl, data, options, time)
        }
        gl.useProgram(this.program)
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        this.setModelMatrix(modelMatrix)
        for (const worm of this.worms) {
            worm.draw(gl, this.bindPosition, this.bindSegment, this.setCurrSegment)
        }
    }
}

export default Worms
