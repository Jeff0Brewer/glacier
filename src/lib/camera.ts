import { mat4, vec3 } from 'gl-matrix'

const ROTATE_SPEED = 0.007
const ZOOM_SPEED = 0.001

class Camera {
    matrix: mat4 // matrix to apply camera transformations to
    axis: vec3 // axis for vertical mouse rotations
    dragging: boolean

    constructor (matrix: mat4, eye: vec3, focus: vec3, up: vec3) {
        this.dragging = false
        this.matrix = matrix
        this.axis = vec3.create()
        vec3.subtract(this.axis, focus, eye)
        vec3.cross(this.axis, this.axis, up)
        vec3.normalize(this.axis, this.axis)
    }

    setupEventHandlers (element: HTMLElement): (() => void) {
        const dragTrue = (): void => { this.dragging = true }
        const dragFalse = (): void => { this.dragging = false }
        const mouseMove = (e: MouseEvent): void => {
            if (this.dragging) {
                this.mouseRotate(e.movementX, e.movementY)
            }
        }
        const mouseWheel = (e: WheelEvent): void => {
            e.preventDefault()
            this.scrollZoom(e.deltaY)
        }
        element.addEventListener('mousedown', dragTrue)
        element.addEventListener('mouseup', dragFalse)
        element.addEventListener('mouseleave', dragFalse)
        element.addEventListener('mousemove', mouseMove)
        element.addEventListener('wheel', mouseWheel)

        return (): void => {
            element.removeEventListener('mousedown', dragTrue)
            element.removeEventListener('mouseup', dragFalse)
            element.removeEventListener('mouseleave', dragFalse)
            element.removeEventListener('mousemove', mouseMove)
            element.removeEventListener('wheel', mouseWheel)
        }
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
        vec3.normalize(this.axis, this.axis)
        mat4.rotate(this.matrix, this.matrix, rotationX, this.axis)
    }

    scrollZoom (delta: number): void {
        const scale = 1.0 + delta * ZOOM_SPEED
        mat4.scale(this.matrix, this.matrix, [scale, scale, scale])
    }
}

export default Camera
