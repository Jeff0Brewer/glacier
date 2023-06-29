import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import { WIDTH, HEIGHT } from '../lib/data-load'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import Camera from '../lib/camera'
import Glacier from '../vis/glacier'
import Worms from '../vis/worms'
import FlowLines from '../vis/flow'

const HEIGHT_SCALE = 100

type VisMode = 'flow' | 'worm'

class VisRenderer {
    data: ModelData
    options: FlowOptions
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    scale: mat4
    camera: Camera
    glacier: Glacier
    worms: Worms
    flow: FlowLines
    mode: VisMode

    constructor (canvas: HTMLCanvasElement, data: ModelData, surface: HTMLImageElement) {
        this.data = data
        this.options = { vel: true, p1: true, p2: true, p3: true }
        this.mode = 'worm'

        this.gl = initGl(canvas)
        this.gl.enable(this.gl.DEPTH_TEST)
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

        this.model = mat4.create()

        const eye = vec3.fromValues(0.5, -0.2, 0.6)
        const focus = vec3.fromValues(0, 0, 0)
        const up = vec3.fromValues(0, 0, 1)
        this.view = mat4.lookAt(mat4.create(), eye, focus, up)

        const fov = 1
        const aspect = canvas.width / canvas.height
        const near = 0.1
        const far = 50

        this.proj = mat4.perspective(mat4.create(), fov, aspect, near, far)

        const scaleValue = 1 / ((WIDTH + HEIGHT) / 2)
        this.scale = mat4.translate(
            mat4.create(),
            mat4.fromScaling(
                mat4.create(),
                [scaleValue, scaleValue, scaleValue]
            ),
            [-WIDTH * 0.5, -HEIGHT * 0.5, 0]
        )

        this.camera = new Camera(canvas, this.model, eye, focus, up)

        this.glacier = new Glacier(
            this.gl,
            surface,
            this.model,
            this.view,
            this.proj,
            this.scale,
            HEIGHT_SCALE
        )

        this.flow = new FlowLines(
            this.gl,
            surface,
            this.model,
            this.view,
            this.proj,
            this.scale,
            HEIGHT_SCALE
        )

        this.worms = new Worms(
            this.gl,
            data,
            surface,
            this.model,
            this.view,
            this.proj,
            this.scale,
            HEIGHT_SCALE,
            0.05,
            200
        )

        window.addEventListener('resize', (): void => {
            this.gl.viewport(0, 0, canvas.width, canvas.height)

            const aspect = canvas.width / canvas.height
            mat4.perspective(this.proj, fov, aspect, near, far)
            this.gl.useProgram(this.glacier.program)
            this.glacier.setProjMatrix(this.proj)
            this.gl.useProgram(this.worms.program)
            this.worms.setProjMatrix(this.proj)
            this.gl.useProgram(this.flow.program)
            this.flow.setProjMatrix(this.proj)
        })
    }

    setMode (mode: VisMode): void {
        if (mode === 'flow') {
            this.flow.update(
                this.gl,
                this.data,
                this.options,
                WIDTH,
                HEIGHT,
                0.05,
                200
            )
        }
        this.mode = mode
    }

    draw (time: number): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.glacier.draw(this.gl, this.model)
        switch (this.mode) {
            case 'worm':
                this.worms.update(this.gl, this.data, this.options, time)
                this.worms.draw(this.gl, this.model)
                break
            case 'flow':
                this.flow.draw(this.gl, this.model)
                break
        }
    }
}

export default VisRenderer

export type {
    VisMode
}
