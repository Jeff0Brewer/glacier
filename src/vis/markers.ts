import { mat4, vec3 } from 'gl-matrix'
import { calcFlowVelocity } from '../lib/flow-calc'
import type { FlowOptions } from '../lib/flow-calc'
import type { ModelData } from '../lib/data-load'
import MarkerPin from '../vis/marker-pin'
import MarkerBase from '../vis/marker-base'

const markerColors = [
    vec3.fromValues(0.6, 0.2, 0.68),
    vec3.fromValues(0.94, 0.96, 0),
    vec3.fromValues(1, 0.24, 0.78),
    vec3.fromValues(0, 0.79, 0.8),
    vec3.fromValues(0, 0.49, 0.47)
]

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
        data: ModelData,
        options: FlowOptions,
        time: number,
        marker: Marker
    ): void {
        const vel = calcFlowVelocity(data, options, marker.y, marker.x, time)
        this.pin.draw(gl, marker, vel)
        this.base.draw(gl, marker, vel)
    }
}

export default Markers

export {
    markerColors
}

export type {
    Marker
}
