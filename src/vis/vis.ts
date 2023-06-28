import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import type { ModelData } from '../lib/data-load'
import { loadDataset, WIDTH, HEIGHT } from '../lib/data-load'
import Camera from '../lib/camera'
import Glacier from '../vis/glacier'
import Worms from '../vis/worms'

class VisRenderer {
    data: ModelData | null
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    scale: mat4
    camera: Camera
    glacier: Glacier
    worms: Worms

    constructor (canvas: HTMLCanvasElement) {
        this.data = null
        this.gl = initGl(canvas)
        this.gl.enable(this.gl.DEPTH_TEST)

        const eye = vec3.fromValues(1, 1, 1)
        const focus = vec3.fromValues(0, 0, 0)
        const up = vec3.fromValues(0, 0, 1)
        const fov = 1
        const aspect = canvas.width / canvas.height
        const near = 0.1
        const far = 50
        const scaleValue = 1 / ((WIDTH + HEIGHT) / 2)
        this.model = mat4.create()
        this.view = mat4.lookAt(mat4.create(), eye, focus, up)
        this.proj = mat4.perspective(mat4.create(), fov, aspect, near, far)
        this.scale = mat4.translate(
            mat4.create(),
            mat4.fromScaling(
                mat4.create(),
                [scaleValue, scaleValue, scaleValue]
            ),
            [-WIDTH * 0.5, -HEIGHT * 0.5, 0]
        )

        this.camera = new Camera(canvas, this.model, eye, focus, up)

        this.glacier = new Glacier(this.gl)
        this.gl.useProgram(this.glacier.program)
        this.glacier.setModelMatrix(this.model)
        this.glacier.setViewMatrix(this.view)
        this.glacier.setProjMatrix(this.proj)
        this.glacier.setScaleMatrix(this.scale)
        this.glacier.setSurface(this.gl, './data/bedmap2_surface_rutford_5px.png')
        this.glacier.setDimensions(WIDTH, HEIGHT)

        this.worms = new Worms(this.gl, WIDTH, HEIGHT, 0.05, 100)
        this.gl.useProgram(this.worms.program)
        this.worms.setModelMatrix(this.model)
        this.worms.setViewMatrix(this.view)
        this.worms.setProjMatrix(this.proj)
        this.worms.setScaleMatrix(this.scale)

        window.addEventListener('resize', (): void => {
            const aspect = canvas.width / canvas.height
            mat4.perspective(this.proj, fov, aspect, near, far)
            this.gl.useProgram(this.glacier.program)
            this.glacier.setProjMatrix(this.proj)
            this.gl.useProgram(this.worms.program)
            this.worms.setProjMatrix(this.proj)
            this.gl.viewport(0, 0, canvas.width, canvas.height)
        })
    }

    async getData (): Promise<void> {
        this.data = await loadDataset()
    }

    draw (time: number): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.glacier.draw(this.gl, this.model)
        if (this.data) {
            this.worms.update(this.gl, this.data, { vel: true, p1: true, p2: true, p3: true }, time)
            this.worms.draw(this.gl, this.model)
        }
    }
}

export default VisRenderer
