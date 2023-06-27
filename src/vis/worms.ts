import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import vertSource from '../shaders/worms-vert.glsl?raw'
import fragSource from '../shaders/worms-frag.glsl?raw'

// floats per vertex for attribs
const POS_FPV = 3

class Worm {
    x: number
    y: number
    z: number
    width: number
    height: number
    time: number
    numVertex: number
    buffer: WebGLBuffer
    verts: Float32Array

    constructor (
        gl: WebGLRenderingContext,
        x: number,
        y: number,
        history: number,
        width: number,
        height: number
    ) {
        this.x = x
        this.y = y
        this.z = 0.15
        this.width = width
        this.height = height
        this.time = 0
        this.numVertex = history * 2
        this.verts = new Float32Array(this.numVertex * POS_FPV)
        this.buffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, this.verts, gl.DYNAMIC_DRAW)
    }

    update (data: ModelData, options: FlowOptions, time: number): void {
        this.time = time
        const velocity = calcFlowVelocity(data, options, this.x, this.height - this.y, time / 1000)
        const velScale = 20
        this.verts.set([
            this.y,
            this.x,
            this.z,
            this.y + velocity[0] * velScale,
            this.x + velocity[1] * velScale,
            this.z + velocity[2] * 0.01
        ])
    }

    draw (gl: WebGLRenderingContext, bindPosition: () => void): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.verts, gl.DYNAMIC_DRAW)
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
                this.worms.push(new Worm(gl, x, y, history, width, height))
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

    update (data: ModelData, options: FlowOptions, time: number): void {
        for (const worm of this.worms) {
            worm.update(data, options, time)
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
