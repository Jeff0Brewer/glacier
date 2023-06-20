import { mat4 } from 'gl-matrix'
import Glacier from '../vis/glacier'
import { initGl } from '../lib/gl-wrap'

class VisRenderer {
    gl: WebGLRenderingContext
    model: mat4
    view: mat4
    proj: mat4
    glacier: Glacier

    constructor (canvas: HTMLCanvasElement) {
        this.gl = initGl(canvas)
        this.model = mat4.create()
        this.view = mat4.lookAt(
            mat4.create(),
            [1, 1, 1],
            [0, 0, 0],
            [0, 0, 1]
        )
        this.proj = mat4.perspective(
            mat4.create(),
            1,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        )
        this.glacier = new Glacier(this.gl)
        this.glacier.setModelMatrix(this.model)
        this.glacier.setViewMatrix(this.view)
        this.glacier.setProjMatrix(this.proj)
        this.glacier.setSurface(this.gl, './data/bedmap2_surface_rutford.png')
    }

    draw (): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.glacier.draw(this.gl)
    }
}

export default VisRenderer
