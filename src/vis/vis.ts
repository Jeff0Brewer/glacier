import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import { getInvMatrix, getMouseRay } from '../lib/unproject'
import { WIDTH, HEIGHT } from '../lib/data-load'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import type { Marker } from '../vis/markers'
import Camera from '../lib/camera'
import Glacier from '../vis/glacier'
import FlowLines from '../vis/flow'
import Markers from '../vis/markers'
import Worms from '../vis/worms'

const HEIGHT_SCALE = 50
const FLOW_DENSITY = 0.065
const FLOW_HISTORY = 200

const FOV = 1
const NEAR = 0.1
const FAR = 50

class VisRenderer {
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    scale: mat4
    camera: Camera
    glacier: Glacier
    flow: FlowLines
    markers: Markers
    worms: Worms

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

        const aspect = canvas.width / canvas.height
        this.proj = mat4.perspective(mat4.create(), FOV, aspect, NEAR, FAR)

        const scaleValue = 1 / ((WIDTH + HEIGHT) / 2)
        this.scale = mat4.translate(
            mat4.create(),
            mat4.fromScaling(
                mat4.create(),
                [scaleValue, scaleValue, scaleValue]
            ),
            [-WIDTH * 0.5, -HEIGHT * 0.5, 0]
        )

        this.camera = new Camera(this.model, eye, focus, up)

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

        this.markers = new Markers(
            this.gl,
            this.model,
            this.view,
            this.proj,
            this.scale
        )

        this.worms = new Worms(
            this.gl,
            surface,
            this.model,
            this.view,
            this.proj,
            this.scale,
            HEIGHT_SCALE
        )
    }

    setupEventHandlers (canvas: HTMLCanvasElement): (() => void) {
        const onResize = (): void => {
            this.gl.viewport(0, 0, canvas.width, canvas.height)

            const aspect = canvas.width / canvas.height
            mat4.perspective(this.proj, FOV, aspect, NEAR, FAR)

            this.gl.useProgram(this.glacier.program)
            this.glacier.setProjMatrix(this.proj)

            this.gl.useProgram(this.flow.program)
            this.flow.setProjMatrix(this.proj)

            this.gl.useProgram(this.markers.program)
            this.markers.setProjMatrix(this.proj)

            this.gl.useProgram(this.worms.program)
            this.worms.setProjMatrix(this.proj)
        }

        window.addEventListener('resize', onResize)
        const removeCameraEvents = this.camera.setupEventHandlers(canvas)

        return (): void => {
            window.removeEventListener('resize', onResize)
            removeCameraEvents()
        }
    }

    unprojectMouse (x: number, y: number): vec3 | null {
        const inv = getInvMatrix([this.proj, this.view, this.model, this.scale])
        const { origin, direction } = getMouseRay(x, y, inv)
        return this.glacier.hitTest(origin, direction)
    }

    placeWorms (x: number, y: number): void {
        const pos = this.unprojectMouse(x, y)
        if (pos) {
            this.worms.placeWorms(this.gl, pos)
        }
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

    draw (data: ModelData, options: FlowOptions, time: number, markers: Array<Marker>): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.glacier.draw(this.gl, this.model)
        this.flow.draw(this.gl, this.model)

        this.gl.useProgram(this.markers.program)
        this.markers.setModelMatrix(this.model)
        for (const marker of markers) {
            this.markers.draw(this.gl, data, options, time, marker)
        }

        this.gl.useProgram(this.worms.program)
        this.worms.update(this.gl, data, options, time)
        this.worms.draw(this.gl, this.model)
    }
}

export default VisRenderer
