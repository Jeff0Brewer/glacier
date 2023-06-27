import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import type { ModelData } from '../lib/data-load'
import { loadDataset } from '../lib/data-load'
import Camera from '../lib/camera'
import Glacier from '../vis/glacier'
import Worms from '../vis/worms'

class VisRenderer {
    data: ModelData | null
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    camera: Camera
    glacier: Glacier
    worms: Worms

    constructor (canvas: HTMLCanvasElement) {
        this.data = null
        this.gl = initGl(canvas)
        this.gl.enable(this.gl.DEPTH_TEST)

        this.model = mat4.create()

        const eye = vec3.fromValues(1, 1, 1)
        const focus = vec3.fromValues(0, 0, 0)
        const up = vec3.fromValues(0, 0, 1)
        this.view = mat4.lookAt(mat4.create(), eye, focus, up)

        const fov = 1
        const aspect = canvas.width / canvas.height
        const near = 0.1
        const far = 50
        this.proj = mat4.perspective(mat4.create(), fov, aspect, near, far)

        this.camera = new Camera(canvas, this.model, eye, focus, up)

        this.glacier = new Glacier(this.gl)
        this.gl.useProgram(this.glacier.program)
        this.glacier.setModelMatrix(this.model)
        this.glacier.setViewMatrix(this.view)
        this.glacier.setProjMatrix(this.proj)
        this.glacier.setSurface(this.gl, './data/bedmap2_surface_rutford_5px.png')

        this.worms = new Worms(this.gl, 1000, 1000, 0.05, 10)
        this.gl.useProgram(this.worms.program)
        this.worms.setModelMatrix(this.model)
        this.worms.setViewMatrix(this.view)
        this.worms.setProjMatrix(this.proj)

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
            this.worms.update(this.data, { vel: true, p1: true, p2: true, p3: true }, time)
            this.worms.draw(this.gl, this.model)
        }
    }
}

export default VisRenderer
