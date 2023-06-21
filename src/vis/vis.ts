import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import Camera from '../lib/camera'
import Glacier from '../vis/glacier'

class VisRenderer {
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    glacier: Glacier
    camera: Camera

    constructor (canvas: HTMLCanvasElement) {
        this.gl = initGl(canvas)
        this.gl.enable(this.gl.DEPTH_TEST)

        this.model = mat4.create()

        const eye = vec3.fromValues(1, 1, 1)
        const focus = vec3.fromValues(0, 0, 0)
        const up = vec3.fromValues(0, 0, 1)
        this.view = mat4.lookAt(mat4.create(), eye, focus, up)

        const aspect = canvas.width / canvas.height
        this.proj = mat4.perspective(mat4.create(), 1, aspect, 0.1, 100)

        this.camera = new Camera(canvas, this.model, eye, focus, up)

        this.glacier = new Glacier(this.gl)
        this.glacier.setModelMatrix(this.model)
        this.glacier.setViewMatrix(this.view)
        this.glacier.setProjMatrix(this.proj)
        this.glacier.setSurface(this.gl, './data/bedmap2_surface_rutford.png')
    }

    draw (): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.glacier.setModelMatrix(this.model)
        this.glacier.draw(this.gl)
    }
}

export default VisRenderer
