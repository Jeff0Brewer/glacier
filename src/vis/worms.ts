import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute, initTexture } from '../lib/gl-wrap'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import vertSource from '../shaders/worms-vert.glsl?raw'
import fragSource from '../shaders/worms-frag.glsl?raw'

const WORM_SPEED = 1
const MIN_WORM_SPEED = 0.2
const WORM_LIFESPAN = 800
const WORM_HISTORY = 300

// floats per vertex for attribs
const POS_FPV = 2
const SEG_FPV = 1
const PRP_FPV = 2
const ALL_FPV = POS_FPV + SEG_FPV + PRP_FPV

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
    lifespan: number
    startX: number
    startY: number
    currSegment: number
    history: number
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
        this.lifespan = 0
        this.startX = x
        this.startY = y
        this.currSegment = 0
        this.numVertex = history * 6
        this.ringBuffer = new RingSubBuffer(gl, this.numVertex * ALL_FPV)
    }

    update (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number): void {
        const velocity = calcFlowVelocity(data, options, this.y, this.x, time)
        vec3.multiply(velocity, velocity, [1, -1, 1])
        let speed = vec3.length(velocity)
        if (speed < MIN_WORM_SPEED) {
            vec3.scale(
                velocity,
                vec3.normalize(velocity, velocity),
                MIN_WORM_SPEED
            )
            speed = MIN_WORM_SPEED // for lifespan tracking
        }

        const lastX = this.x
        const lastY = this.y
        this.x += velocity[0] * WORM_SPEED
        this.y += velocity[1] * WORM_SPEED

        const perp = vec3.cross(vec3.create(), velocity, [0, 0, 1])
        vec3.normalize(perp, perp)

        const lastSegment = this.currSegment
        this.currSegment += 1
        const verts = new Float32Array([
            lastX, lastY,
            lastSegment,
            -perp[0], -perp[1],
            lastX, lastY,
            lastSegment,
            perp[0], perp[1],
            this.x, this.y,
            this.currSegment,
            perp[0], perp[1],
            lastX, lastY,
            lastSegment,
            -perp[0], -perp[1],
            this.x, this.y,
            this.currSegment,
            perp[0], perp[1],
            this.x, this.y,
            this.currSegment,
            -perp[0], -perp[1]
        ])
        this.ringBuffer.set(gl, verts)

        this.lifespan += Math.pow(speed, 0.25)
    }

    fadeOut (setCurrSegment: (ind: number) => void): void {
        this.lifespan += 1
        this.currSegment += 1
        setCurrSegment(this.currSegment)
    }

    draw (
        gl: WebGLRenderingContext,
        bindAttrib: () => void,
        setCurrSegment: (ind: number) => void
    ): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ringBuffer.buffer)
        bindAttrib()
        setCurrSegment(this.currSegment)
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertex)
    }
}

class Worms {
    worms: Array<Worm>
    program: WebGLProgram
    texture: WebGLTexture
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setCurrSegment: (ind: number) => void

    constructor (
        gl: WebGLRenderingContext,
        surface: HTMLImageElement,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4,
        heightScale: number
    ) {
        this.worms = []
        this.program = initProgram(gl, vertSource, fragSource)
        this.texture = initTexture(gl)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            surface
        )

        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        const bindSegment = initAttribute(gl, this.program, 'segment', SEG_FPV, ALL_FPV, POS_FPV)
        const bindPerp = initAttribute(gl, this.program, 'perp', PRP_FPV, ALL_FPV, POS_FPV + SEG_FPV)
        this.bindAttrib = (): void => {
            bindPosition()
            bindSegment()
            bindPerp()
        }

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        const uCurrSegment = gl.getUniformLocation(this.program, 'currSegment')
        const uDimensions = gl.getUniformLocation(this.program, 'dimensions')
        const uHeightScale = gl.getUniformLocation(this.program, 'heightScale')
        const uHistory = gl.getUniformLocation(this.program, 'history')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)
        gl.uniform2f(uDimensions, surface.width, surface.height)
        gl.uniform1f(uHeightScale, heightScale)
        gl.uniform1f(uHistory, WORM_HISTORY)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setCurrSegment = (scale: number): void => { gl.uniform1f(uCurrSegment, scale) }
    }

    placeWorm (gl: WebGLRenderingContext, pos: vec3): void {
        this.worms.push(new Worm(gl, WORM_HISTORY, pos[0], pos[1]))
    }

    update (gl: WebGLRenderingContext, data: ModelData, options: FlowOptions, time: number): void {
        for (let i = 0; i < this.worms.length; i++) {
            if (this.worms[i].lifespan < WORM_LIFESPAN) {
                // update if still in lifespan
                this.worms[i].update(gl, data, options, time)
            } else if (this.worms[i].lifespan > WORM_LIFESPAN + WORM_HISTORY) {
                // remove if past lifespan and fully faded out
                this.worms.splice(i, 1)
                i--
            } else {
                // fade out if past lifespan but still visible
                this.worms[i].fadeOut(this.setCurrSegment)
            }
        }
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        this.setModelMatrix(modelMatrix)
        for (const worm of this.worms) {
            worm.draw(gl, this.bindAttrib, this.setCurrSegment)
        }
    }
}

export default Worms
