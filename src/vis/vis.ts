import { mat4, vec3 } from 'gl-matrix'
import { initGl } from '../lib/gl-wrap'
import Camera from '../lib/camera'
import Glacier from '../vis/glacier'

class VisRenderer {
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    camera: Camera
    glacier: Glacier

    constructor (canvas: HTMLCanvasElement) {
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
        this.glacier.setModelMatrix(this.model)
        this.glacier.setViewMatrix(this.view)
        this.glacier.setProjMatrix(this.proj)
        this.glacier.setSurface(this.gl, './data/bedmap2_surface_rutford_5px.png')

        window.addEventListener('resize', (): void => {
            const aspect = canvas.width / canvas.height
            mat4.perspective(this.proj, fov, aspect, near, far)
            this.gl.useProgram(this.glacier.program)
            this.glacier.setProjMatrix(this.proj)
            this.gl.viewport(0, 0, canvas.width, canvas.height)
        })
    }

    draw (): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.glacier.setModelMatrix(this.model)
        this.glacier.draw(this.gl)
    }
}

export default VisRenderer
