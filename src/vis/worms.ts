import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import vertSource from '../shaders/worms-vert.glsl?raw'
import fragSource from '../shaders/worms-frag.glsl?raw'

class RingSubBuffer {
    start: number
    end: number
    curr: number

    constructor (start: number, end: number) {
        this.start = start
        this.end = end
        this.curr = start
    }

    set (gl: WebGLRenderingContext, buffer: WebGLBuffer, vals: Float32Array): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        if (this.end - this.curr > vals.length) {
            gl.bufferSubData(gl.ARRAY_BUFFER, this.curr * vals.BYTES_PER_ELEMENT, vals)
            this.curr += vals.length
        } else {
            const wrap = vals.slice(0, this.end - this.start)
            gl.bufferSubData(gl.ARRAY_BUFFER, this.curr * vals.BYTES_PER_ELEMENT, wrap)
            this.curr = this.start
            this.set(gl, buffer, vals.slice(this.end - this.start))
        }
    }
}

// floats per vertex for attribs
const POS_FPV = 3

const WORM_SPEED = 10

class Worm {
    x: number
    y: number
    z: number
    time: number
    numVertex: number
    buffer: WebGLBuffer
    ringBuffer: RingSubBuffer

    constructor (
        gl: WebGLRenderingContext,
        history: number,
        x: number,
        y: number
    ) {
        this.x = x
        this.y = y
        this.z = 100
        this.time = 0
        this.numVertex = history * 2
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.numVertex * POS_FPV), gl.DYNAMIC_DRAW)
        this.ringBuffer = new RingSubBuffer(0, this.numVertex * POS_FPV)
    }

    update (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number): void {
        time /= 1000
        const deltaTime = time - this.time
        this.time = time
        // prevent updates after freezes
        if (deltaTime > 1) { return }
        const velocity = calcFlowVelocity(data, options, this.y, this.x, time)
        const lastX = this.x
        const lastY = this.y
        const lastZ = this.z
        this.x -= velocity[0] * deltaTime * WORM_SPEED
        this.y -= velocity[1] * deltaTime * WORM_SPEED
        this.z -= velocity[2] * deltaTime * WORM_SPEED
        const line = new Float32Array([
            lastX,
            lastY,
            lastZ,
            this.x,
            this.y,
            this.z
        ])
        this.ringBuffer.set(gl, this.buffer, line)
    }

    draw (gl: WebGLRenderingContext, bindPosition: () => void): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        bindPosition()
        gl.drawArrays(gl.LINES, 0, this.numVertex)
    }
}

class Worms {
    worms: Array<Worm>
    program: WebGLProgram
    bindPosition: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setScaleMatrix: (mat: mat4) => void

    constructor (
        gl: WebGLRenderingContext,
        width: number,
        height: number,
        density: number,
        history: number
    ) {
        this.worms = []
        for (let x = 0; x < width; x += 1 / density) {
            for (let y = 0; y < height; y += 1 / density) {
                this.worms.push(new Worm(gl, history, x, y))
            }
        }

        this.program = initProgram(gl, vertSource, fragSource)
        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0)
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
    }

    update (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number): void {
        for (const worm of this.worms) {
            worm.update(gl, data, options, time)
        }
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        this.setModelMatrix(modelMatrix)
        for (const worm of this.worms) {
            worm.draw(gl, this.bindPosition)
        }
    }
}

export default Worms
