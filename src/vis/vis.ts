import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import { getInvMatrix, getMouseRay } from '../lib/unproject'
import { WIDTH, HEIGHT } from '../lib/data-load'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import Camera from '../lib/camera'
import Glacier from '../vis/glacier'
import FlowLines from '../vis/flow'

const HEIGHT_SCALE = 50
const FLOW_DENSITY = 0.065
const FLOW_HISTORY = 200

class VisRenderer {
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    scale: mat4
    camera: Camera
    glacier: Glacier
    flow: FlowLines

    constructor (canvas: HTMLCanvasElement, surface: HTMLImageElement, texture: HTMLImageElement) {
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
            texture,
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

        window.addEventListener('resize', (): void => {
            this.gl.viewport(0, 0, canvas.width, canvas.height)

            const aspect = canvas.width / canvas.height
            mat4.perspective(this.proj, fov, aspect, near, far)

            this.gl.useProgram(this.glacier.program)
            this.glacier.setProjMatrix(this.proj)

            this.gl.useProgram(this.flow.program)
            this.flow.setProjMatrix(this.proj)
        })
    }

    mouseSelect (x: number, y: number): void {
        const inv = getInvMatrix([this.proj, this.view, this.model, this.scale])
        const { origin, direction } = getMouseRay(x, y, inv)
        const intersection = this.glacier.hitTest(origin, direction)

        console.log(intersection)
    }

    calcFlow (data: ModelData, options: FlowOptions): void {
        this.flow.update(
            data,
            options,
            WIDTH,
            HEIGHT,
            FLOW_DENSITY,
            FLOW_HISTORY
        )
    }

    draw (): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.glacier.draw(this.gl, this.model)
        this.flow.draw(this.gl, this.model)
    }
}

export default VisRenderer
