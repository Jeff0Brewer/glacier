import { mat4, vec3 } from 'gl-matrix'

const ROTATE_SPEED = 0.007
const PAN_SPEED = 0.001
const ZOOM_SPEED = 0.001

class Camera {
    matrix: mat4 // matrix to apply camera transformations to
    axis: vec3 // axis for vertical mouse rotations
    center: vec3 // position to zoom into / rotate about, altered by panning
    scale: number // track current scale for pan distance
    dragging: boolean

    constructor (matrix: mat4, eye: vec3, focus: vec3, up: vec3) {
        this.matrix = matrix
        this.axis = vec3.create()
        vec3.subtract(this.axis, focus, eye)
        vec3.cross(this.axis, this.axis, up)
        vec3.normalize(this.axis, this.axis)
        this.center = vec3.clone(focus)
        this.scale = 1
        this.dragging = false
    }

    setupEventHandlers (element: HTMLElement): (() => void) {
        const dragTrue = (): void => { this.dragging = true }
        const dragFalse = (): void => { this.dragging = false }
        const mouseWheel = (e: WheelEvent): void => {
            e.preventDefault()
            this.scrollZoom(e.deltaY)
        }
        element.addEventListener('mousedown', dragTrue)
        element.addEventListener('mouseup', dragFalse)
        element.addEventListener('mouseleave', dragFalse)
        element.addEventListener('wheel', mouseWheel)
        return (): void => {
            element.removeEventListener('mousedown', dragTrue)
            element.removeEventListener('mouseup', dragFalse)
            element.removeEventListener('mouseleave', dragFalse)
            element.removeEventListener('wheel', mouseWheel)
        }
    }

    mouseRotate (dx: number, dy: number): void {
        if (!this.dragging) { return }

        const rotationX = dy * ROTATE_SPEED
        const rotationZ = dx * ROTATE_SPEED

        // rotate axis opposite of z rotation to get axis for vertical rotations
        const negRotationZ = mat4.fromZRotation(mat4.create(), -rotationZ)
        vec3.transformMat4(this.axis, this.axis, negRotationZ)

        mat4.translate(this.matrix, this.matrix, vec3.scale(vec3.create(), this.center, -1))
        mat4.rotateZ(this.matrix, this.matrix, rotationZ)
        mat4.rotate(this.matrix, this.matrix, rotationX, this.axis)
        mat4.translate(this.matrix, this.matrix, this.center)
    }

    mousePan (dx: number, dy: number): void {
        if (!this.dragging) { return }

        const axisY = vec3.cross(vec3.create(), this.axis, [0, 0, 1])
        const speed = PAN_SPEED / this.scale

        const translation = vec3.create()
        vec3.scale(translation, this.axis, dx * speed)
        vec3.scaleAndAdd(translation, translation, axisY, dy * speed)
        mat4.translate(this.matrix, this.matrix, translation)

        // translate center to track origin for zoom / rotate
        vec3.add(this.center, this.center, translation)
    }

    scrollZoom (delta: number): void {
        const scale = 1.0 + delta * ZOOM_SPEED

        mat4.translate(this.matrix, this.matrix, vec3.scale(vec3.create(), this.center, -1))
        mat4.scale(this.matrix, this.matrix, [scale, scale, scale])
        mat4.translate(this.matrix, this.matrix, this.center)

        // update scale for uniform pan speed at any zoom
        this.scale *= scale
    }
}

export default Camera
