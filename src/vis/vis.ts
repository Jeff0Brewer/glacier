import { mat4, vec3 } from 'gl-matrix'
import Glacier from '../vis/glacier'
import { initGl } from '../lib/gl-wrap'

const CAM_EYE = vec3.fromValues(1, 1, 1)
const CAM_FOCUS = vec3.fromValues(0, 0, 0)
const CAM_UP = vec3.fromValues(0, 0, 1)
const ROTATE_SPEED = 0.007

class Camera {
    matrix: mat4 // matrix to apply camera transformations to
    axis: vec3 // axis for vertical mouse rotations
    dragging: boolean

    constructor (element: HTMLElement, matrix: mat4, eye: vec3, focus: vec3, up: vec3) {
        this.dragging = false
        this.matrix = matrix
        this.axis = vec3.create()
        vec3.subtract(this.axis, focus, eye)
        vec3.cross(this.axis, this.axis, up)
        vec3.normalize(this.axis, this.axis)

        element.addEventListener('mousedown', (): void => { this.dragging = true })
        element.addEventListener('mouseup', (): void => { this.dragging = false })
        element.addEventListener('mouseleave', (): void => { this.dragging = false })
        element.addEventListener('mousemove', (e: MouseEvent): void => {
            if (this.dragging) {
                this.mouseRotate(e.movementX, e.movementY)
            }
        })
    }

    mouseRotate (dx: number, dy: number): void {
        const rotationX = dy * ROTATE_SPEED
        const rotationZ = dx * ROTATE_SPEED
        mat4.rotateZ(this.matrix, this.matrix, rotationZ)
        // transform by opposite of z rotation to get axis for vertical rotations
        vec3.transformMat4(
            this.axis,
            this.axis,
            mat4.fromZRotation(mat4.create(), -rotationZ)
        )
        mat4.rotate(this.matrix, this.matrix, rotationX, this.axis)
    }
}

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
        this.view = mat4.lookAt(
            mat4.create(),
            CAM_EYE,
            CAM_FOCUS,
            CAM_UP
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

        this.camera = new Camera(canvas, this.model, CAM_EYE, CAM_FOCUS, CAM_UP)
    }

    draw (): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT || this.gl.DEPTH_BUFFER_BIT)
        this.glacier.setModelMatrix(this.model)
        this.glacier.draw(this.gl)
    }
}

export default VisRenderer
