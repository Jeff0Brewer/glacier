import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute, initTexture } from '../lib/gl-wrap'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import FlowWorkerURL from '../workers/flow-verts?worker&url'
import vertSource from '../shaders/flow-vert.glsl?raw'
import fragSource from '../shaders/flow-frag.glsl?raw'

// floats per vertex for each attribute
const POS_FPV = 3
const IND_FPV = 1
const SPD_FPV = 1
const ALL_FPV = POS_FPV + IND_FPV + SPD_FPV

class FlowLines {
    worker: Worker
    program: WebGLProgram
    texture: WebGLTexture
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setCurrInd: (ind: number) => void
    numVertex: number
    currInd: number

    constructor (
        gl: WebGLRenderingContext,
        surface: HTMLImageElement,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4,
        heightScale: number
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
        this.numVertex = 0
        this.currInd = 0

        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        const bindInd = initAttribute(gl, this.program, 'ind', IND_FPV, ALL_FPV, POS_FPV)
        const bindSpeed = initAttribute(gl, this.program, 'speed', SPD_FPV, ALL_FPV, POS_FPV + IND_FPV)
        this.bindAttrib = (): void => {
            bindPosition()
            bindInd()
            bindSpeed()
        }

        const uCurrInd = gl.getUniformLocation(this.program, 'currInd')
        this.setCurrInd = (ind: number): void => { gl.uniform1f(uCurrInd, ind) }
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setModelMatrix(model)
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setViewMatrix(view)
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setProjMatrix(proj)

        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)
        const uDimensions = gl.getUniformLocation(this.program, 'dimensions')
        gl.uniform2f(uDimensions, surface.width, surface.height)
        const uHeightScale = gl.getUniformLocation(this.program, 'heightScale')
        gl.uniform1f(uHeightScale, heightScale)
        const uMaxInd = gl.getUniformLocation(this.program, 'maxInd')
        gl.uniform1f(uMaxInd, 50)

        this.worker = new Worker(FlowWorkerURL, { type: 'module' })
        this.worker.onmessage = (e: MessageEvent): void => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
            gl.bufferData(gl.ARRAY_BUFFER, e.data, gl.STATIC_DRAW)
            this.numVertex = e.data.length / ALL_FPV
        }
    }

    update (
        data: ModelData,
        options: FlowOptions,
        width: number,
        height: number,
        density: number,
        history: number
    ): void {
        this.worker.postMessage({ data, options, width, height, density, history })
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindAttrib()
        this.setCurrInd(this.currInd)
        this.setModelMatrix(modelMatrix)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
        this.currInd += 0.5
    }
}

export default FlowLines

export {
    ALL_FPV
}
