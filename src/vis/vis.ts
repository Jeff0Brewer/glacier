import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import { getInvMatrix, getMouseRay } from '../lib/unproject'
import { WIDTH, HEIGHT } from '../lib/data-load'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import type { Marker } from '../vis/markers'
import type { ClickMode } from '../components/app'
import Camera from '../lib/camera'
import Glacier from '../vis/glacier'
import FlowLines from '../vis/flow'
import Markers from '../vis/markers'
import Worms from '../vis/worms'

const HEIGHT_SCALE = 50
const FLOW_DENSITY = 0.07
const FLOW_HISTORY = 180

const FOV = 1
const NEAR = 0.1
const FAR = 50

class VisRenderer {
    gl: WebGLRenderingContext
    canvas: HTMLCanvasElement
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
        this.canvas = canvas

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

    setClickMode (mode: ClickMode): (() => void) | null {
        if (mode === 'rotate') {
            const mouseRotate = (e: MouseEvent): void => {
                this.camera.mouseRotate(e.movementX, e.movementY)
            }
            this.canvas.addEventListener('mousemove', mouseRotate)
            return (): void => {
                this.canvas.removeEventListener('mousemove', mouseRotate)
            }
        }
        if (mode === 'pan') {
            const mousePan = (e: MouseEvent): void => {
                this.camera.mousePan(e.movementX, e.movementY)
            }
            this.canvas.addEventListener('mousemove', mousePan)
            return (): void => {
                this.canvas.removeEventListener('mousemove', mousePan)
            }
        }
        if (mode === 'worm') {
            const pending: Array<[number, number]> = []

            const WORM_DELAY = 50
            let lastT = Date.now()
            const traceWorms = (e: MouseEvent): void => {
                if (!this.camera.dragging) { return }
                const thisT = Date.now()
                const elapsed = thisT - lastT
                if (elapsed > WORM_DELAY) {
                    const x = e.clientX / window.innerWidth * 2 - 1
                    const y = (1 - e.clientY / window.innerHeight) * 2 - 1
                    pending.push([x, y])
                    lastT = thisT
                }
            }

            const addWorms = (): void => {
                let pos = pending.pop()
                while (pos) {
                    const [x, y] = pos
                    this.placeWorm(x, y)
                    pos = pending.pop()
                }
            }

            this.canvas.addEventListener('mousemove', traceWorms)
            this.canvas.addEventListener('mouseup', addWorms)
            return (): void => {
                this.canvas.removeEventListener('mousemove', traceWorms)
                this.canvas.removeEventListener('mouseup', addWorms)
            }
        }
        return null
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

            // multiple programs in markers
            // don't bind program here
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

    placeWorm (x: number, y: number): void {
        const pos = this.unprojectMouse(x, y)
        if (pos) {
            this.worms.placeWorm(this.gl, pos)
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
        this.markers.draw(this.gl, this.model, markers, data, options, time)

        this.gl.useProgram(this.worms.program)
        this.worms.update(this.gl, data, options, time)
        this.worms.draw(this.gl, this.model)
    }
}

export default VisRenderer
