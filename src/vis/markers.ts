import { mat4, vec3 } from 'gl-matrix'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import MarkerPin from '../vis/marker-pin'
import MarkerBase from '../vis/marker-base'

type ColorMode = 'gray' | 'random'

const getColor = (mode: ColorMode, i: number): vec3 => {
    if (mode === 'random') {
        return vec3.fromValues(Math.random(), Math.random(), Math.random())
    }
    const brightness = (0.05 * i) % 0.8 + 0.2
    return vec3.fromValues(brightness, brightness, brightness)
}

type Marker = {
    x: number,
    y: number,
    z: number,
    color: vec3
}

class Markers {
    pin: MarkerPin
    base: MarkerBase
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4
    ) {
        this.pin = new MarkerPin(gl, model, view, proj, scale)
        this.base = new MarkerBase(gl, model, view, proj, scale)

        this.setModelMatrix = (mat: mat4): void => {
            gl.useProgram(this.pin.program)
            this.pin.setModelMatrix(mat)
            gl.useProgram(this.base.program)
            this.base.setModelMatrix(mat)
        }

        this.setViewMatrix = (mat: mat4): void => {
            gl.useProgram(this.pin.program)
            this.pin.setViewMatrix(mat)
            gl.useProgram(this.base.program)
            this.base.setViewMatrix(mat)
        }

        this.setProjMatrix = (mat: mat4): void => {
            gl.useProgram(this.pin.program)
            this.pin.setProjMatrix(mat)
            gl.useProgram(this.base.program)
            this.base.setProjMatrix(mat)
        }
    }

    draw (
        gl: WebGLRenderingContext,
        model: mat4,
        markers: Array<Marker>,
        data: ModelData,
        options: FlowOptions,
        time: number
    ): void {
        this.setModelMatrix(model)
        const vels: Array<vec3> = markers.map(m =>
            calcFlowVelocity(data, options, m.y, m.x, time)
        )
        this.base.bind(gl)
        for (let i = 0; i < markers.length; i++) {
            this.base.draw(gl, markers[i], vels[i])
        }
        this.pin.bind(gl)
        for (let i = 0; i < markers.length; i++) {
            this.pin.draw(gl, markers[i], vels[i])
        }
    }
}

export default Markers

export {
    getColor
}

export type {
    Marker,
    ColorMode
}
