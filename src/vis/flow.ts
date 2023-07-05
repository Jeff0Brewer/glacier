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
    numVertex: number
    currInd: number
    program: WebGLProgram
    buffer: WebGLBuffer
    texture: WebGLTexture
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setCurrInd: (ind: number) => void
    worker: Worker

    constructor (
        gl: WebGLRenderingContext,
        surface: HTMLImageElement,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4,
        heightScale: number
    ) {
        this.numVertex = 0
        this.currInd = 0
        this.program = initProgram(gl, vertSource, fragSource)
        this.buffer = initBuffer(gl)
        this.texture = initTexture(gl)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            surface
        )

        // setup attributes
        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        const bindInd = initAttribute(gl, this.program, 'ind', IND_FPV, ALL_FPV, POS_FPV)
        const bindSpeed = initAttribute(gl, this.program, 'speed', SPD_FPV, ALL_FPV, POS_FPV + IND_FPV)

        // get closure to bind all attributes easily
        this.bindAttrib = (): void => {
            bindPosition()
            bindInd()
            bindSpeed()
        }

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        const uCurrInd = gl.getUniformLocation(this.program, 'currInd')
        const uDimensions = gl.getUniformLocation(this.program, 'dimensions')
        const uHeightScale = gl.getUniformLocation(this.program, 'heightScale')
        const uMaxInd = gl.getUniformLocation(this.program, 'maxInd')

        // initialize uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)
        gl.uniform2f(uDimensions, surface.width, surface.height)
        gl.uniform1f(uHeightScale, heightScale)
        gl.uniform1f(uMaxInd, 50)
        gl.uniform1f(uCurrInd, 0)

        // get closures to easily set uniforms which may change
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setCurrInd = (ind: number): void => { gl.uniform1f(uCurrInd, ind) }

        // setup flow field calculation worker
        this.worker = new Worker(FlowWorkerURL, { type: 'module' })
        this.worker.onmessage = (e: MessageEvent<Float32Array>): void => {
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
        this.worker.postMessage({
            data, options, width, height, density, history
        })
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        this.bindAttrib()
        this.setCurrInd(this.currInd)
        this.setModelMatrix(modelMatrix)
        this.currInd += 0.5

        // disable depth mask so overlapping flow lines will always be drawn fully
        gl.depthMask(false)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
        gl.depthMask(true)
    }
}

export default FlowLines

export { ALL_FPV }
