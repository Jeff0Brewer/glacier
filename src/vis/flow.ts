import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute, initTexture } from '../lib/gl-wrap'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import vertSource from '../shaders/flow-vert.glsl?raw'
import fragSource from '../shaders/flow-frag.glsl?raw'

const POS_FPV = 3
const IND_FPV = 1
const ALL_FPV = POS_FPV + IND_FPV

const MAX_CALC = 200
const TIMESTEP = 0.2
const FLOW_SPEED = 10
const MIN_LINE_LENGTH = 1

const calcFlowLine = (
    data: ModelData,
    options: FlowOptions,
    x: number,
    y: number,
    history: number
): Float32Array => {
    const verts = new Float32Array(history * ALL_FPV)
    const pos = vec3.fromValues(x, y, 0)
    let time = 0

    let i
    for (i = 0; i < history; i++) {
        verts.set([
            pos[0],
            pos[1],
            pos[2],
            i
        ], i * ALL_FPV)

        let calcInd = 0
        const lastPos = vec3.clone(pos)
        while (vec3.distance(pos, lastPos) < MIN_LINE_LENGTH && calcInd < MAX_CALC) {
            const velocity = calcFlowVelocity(data, options, pos[1], pos[0], time)
            vec3.scale(velocity, velocity, TIMESTEP * FLOW_SPEED)
            vec3.add(pos, pos, [velocity[0], -velocity[1], velocity[2]])
            time += TIMESTEP
            calcInd++
        }

        if (calcInd === MAX_CALC) {
            return verts.slice(0, i * ALL_FPV)
        }
    }

    return verts
}

const calcFlow = (
    data: ModelData,
    options: FlowOptions,
    width: number,
    height: number,
    density: number,
    history: number
): Float32Array => {
    const lines = []
    let length = 0
    for (let x = 0; x < width; x += 1 / density) {
        for (let y = 0; y < height; y += 1 / density) {
            const rx = x + Math.random() * 10 + 5
            const ry = y + Math.random() * 10 + 5
            // exclude lines starting with 0 velocity
            const initVelocity = calcFlowVelocity(data, options, ry, rx, 0)
            if (vec3.length(initVelocity) !== 0) {
                const line = calcFlowLine(data, options, rx, ry, history)
                lines.push(line)
                length += line.length
            }
        }
    }
    length += lines.length * 2 * ALL_FPV
    const verts = new Float32Array(length)
    let bufInd = 0
    for (const line of lines) {
        verts[bufInd++] = line[0]
        verts[bufInd++] = line[1]
        verts[bufInd++] = line[2]
        verts[bufInd++] = -1

        verts.set(line, bufInd)
        bufInd += line.length

        verts[bufInd++] = line[line.length - ALL_FPV + 0]
        verts[bufInd++] = line[line.length - ALL_FPV + 1]
        verts[bufInd++] = line[line.length - ALL_FPV + 2]
        verts[bufInd++] = -1
    }
    return verts
}

class FlowLines {
    program: WebGLProgram
    texture: WebGLTexture
    buffer: WebGLBuffer
    bindPosition: () => void
    bindInd: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setScaleMatrix: (mat: mat4) => void
    setDimensions: (width: number, height: number) => void
    setHeightScale: (scale: number) => void
    setCurrInd: (ind: number) => void
    numVertex: number
    currInd: number

    constructor (
        gl: WebGLRenderingContext,
        data: ModelData,
        options: FlowOptions,
        surface: HTMLImageElement,
        width: number,
        height: number,
        density: number,
        history: number
    ) {
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
        this.buffer = initBuffer(gl)
        const verts = calcFlow(data, options, width, height, density, history)
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW)
        this.numVertex = verts.length / ALL_FPV

        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        this.bindInd = initAttribute(gl, this.program, 'ind', IND_FPV, ALL_FPV, POS_FPV)

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        const uDimensions = gl.getUniformLocation(this.program, 'dimensions')
        const uHeightScale = gl.getUniformLocation(this.program, 'heightScale')
        const uCurrInd = gl.getUniformLocation(this.program, 'currInd')
        const uMaxInd = gl.getUniformLocation(this.program, 'maxInd')

        this.setScaleMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uScaleMatrix, false, mat) }
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setHeightScale = (scale: number): void => { gl.uniform1f(uHeightScale, scale) }
        this.setDimensions = (w: number, h: number): void => { gl.uniform2f(uDimensions, w, h) }
        this.setCurrInd = (ind: number): void => { gl.uniform1f(uCurrInd, ind) }
        this.currInd = 0
        this.setCurrInd(this.currInd)
        gl.uniform1f(uMaxInd, history / 5)
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindPosition()
        this.bindInd()
        this.setCurrInd(this.currInd)
        this.setModelMatrix(modelMatrix)
        gl.drawArrays(gl.LINE_STRIP, 0, this.numVertex)
        this.currInd += 0.5
    }
}

export default FlowLines
