import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute, initTexture } from '../lib/gl-wrap'
import vertSource from '../shaders/glacier-vert.glsl?raw'
import fragSource from '../shaders/glacier-frag.glsl?raw'

// floats per vertex for attribs
const POS_FPV = 3
const NRM_FPV = 3

class Glacier {
    program: WebGLProgram
    texture: WebGLTexture
    posBuffer: WebGLBuffer
    nrmBuffer: WebGLBuffer
    bindPosition: () => void
    bindNormal: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    numVertex: number
    posVerts: Float32Array

    constructor (
        gl: WebGLRenderingContext,
        surface: HTMLImageElement,
        texture: HTMLImageElement,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4,
        heightScale: number
    ) {
        this.program = initProgram(gl, vertSource, fragSource)

        this.texture = initTexture(gl)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture)

        // position and normal as seperate buffers
        // so position verts can be used efficiently for mouse interaction hit tests
        const { pos, nrm } = getSurfaceVerts(surface, heightScale)
        this.posBuffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW)
        this.nrmBuffer = initBuffer(gl)
        gl.bufferData(gl.ARRAY_BUFFER, nrm, gl.STATIC_DRAW)

        this.posVerts = pos
        this.numVertex = pos.length / POS_FPV

        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, POS_FPV, 0)
        this.bindNormal = initAttribute(gl, this.program, 'normal', NRM_FPV, NRM_FPV, 0)

        // get uniform locations
        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        const uDimensions = gl.getUniformLocation(this.program, 'dimensions')

        // initialize uniforms
        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)
        gl.uniform2f(uDimensions, surface.width, surface.height)

        // get closures to easily set uniforms which may change
        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
    }

    hitTest (origin: vec3, direction: vec3): vec3 | null {
        for (let i = 0; i < this.posVerts.length; i += POS_FPV) {
            const intersect = triangleRayIntersect(
                origin,
                direction,
                this.posVerts.slice(i, i + 3),
                this.posVerts.slice(i + 3, i + 6),
                this.posVerts.slice(i + 6, i + 9)
            )
            if (intersect) {
                return intersect
            }
        }
        return null
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer)
        this.bindPosition()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nrmBuffer)
        this.bindNormal()
        this.setModelMatrix(modelMatrix)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
    }
}

const triangleRayIntersect = (
    origin: vec3,
    direction: vec3,
    t0: vec3,
    t1: vec3,
    t2: vec3
): vec3 | null => {
    const EPSILON = 0.00001
    const edge0 = vec3.subtract(vec3.create(), t1, t0)
    const edge1 = vec3.subtract(vec3.create(), t2, t0)
    const h = vec3.cross(vec3.create(), direction, edge1)
    const a = vec3.dot(edge0, h)

    if (a > -EPSILON && a < EPSILON) {
        return null
    }

    const f = 1.0 / a
    const s = vec3.subtract(vec3.create(), origin, t0)
    const u = f * vec3.dot(s, h)
    if (u < 0.0 || u > 1.0) {
        return null
    }

    const q = vec3.cross(vec3.create(), s, edge0)
    const v = f * vec3.dot(direction, q)

    if (v < 0.0 || u + v > 1.0) {
        return null
    }

    const t = f * vec3.dot(edge1, q)
    const intersection = vec3.scaleAndAdd(
        vec3.create(),
        origin,
        direction,
        t
    )
    return intersection
}

// from width and height, create plane triangle strip with position and tex coordinate attributes
const getSurfaceVerts = (img: HTMLImageElement, heightScale: number): {pos: Float32Array, nrm: Float32Array } => {
    const imgReader = new ImageReader(img)

    // scale down dimensions, don't need a vertex at every image pixel
    const DOWNSAMPLE = 4
    const width = Math.ceil(img.width / DOWNSAMPLE)
    const height = Math.ceil(img.height / DOWNSAMPLE)

    // helper to get height mapped position from x, y
    const get3dPos = (x: number, y: number): vec3 => {
        const px = x * DOWNSAMPLE
        const py = y * DOWNSAMPLE
        const height = vec3.length(imgReader.getRGB(px, py)) / 255 * heightScale
        return vec3.fromValues(px, py, height)
    }

    // helper to calc normal at x, y from height map
    const NORM_DELTA = 2
    const getNormal = (x: number, y: number): vec3 => {
        // get vecs crossing through x, y from height map and delta
        const xVec = vec3.subtract(
            vec3.create(),
            get3dPos(x + NORM_DELTA, y),
            get3dPos(x - NORM_DELTA, y)
        )
        const yVec = vec3.subtract(
            vec3.create(),
            get3dPos(x, y + NORM_DELTA),
            get3dPos(x, y - NORM_DELTA)
        )
        // cross perp vecs to get norm
        const norm = vec3.cross(vec3.create(), xVec, yVec)
        vec3.normalize(norm, norm)
        return norm
    }

    const NUM_VERT = (width - 1) * height * 2 // 2 vert per pos since drawing as triangle strip
    const pos = new Float32Array(NUM_VERT * POS_FPV)
    const nrm = new Float32Array(NUM_VERT * NRM_FPV)
    let posInd = 0
    let nrmInd = 0

    // helper to set vertex from x, y and height map
    // multiply by downsample to get coords aligned with pixel inds
    const setVert = (x: number, y: number): void => {
        pos.set(get3dPos(x, y), posInd)
        posInd += POS_FPV
        nrm.set(getNormal(x, y), nrmInd)
        nrmInd += NRM_FPV
    }

    // helper to set single line in plane's triangle strip
    const setStrip = (x: number, y: number): void => {
        setVert(x, y)
        setVert(x + 1, y)
    }

    for (let x = 0; x < width - 1; x++) {
        // alternate y increment direction for each column
        if (x % 2 === 0) {
            for (let y = 0; y < height; y++) {
                setStrip(x, y)
            }
        } else {
            for (let y = height - 1; y >= 0; y--) {
                setStrip(x, y)
            }
        }
    }

    return { pos, nrm }
}

class ImageReader {
    data: Uint8ClampedArray
    width: number
    height: number

    constructor (img: HTMLImageElement) {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) { throw new Error('Failed to get offscreen drawing context') }
        ctx.drawImage(img, 0, 0)

        this.data = ctx.getImageData(0, 0, img.width, img.height).data
        this.width = img.width
        this.height = img.height
    }

    getRGB (x: number, y: number): vec3 {
        const ind = (y * this.width + x) * 4
        return vec3.fromValues(
            this.data[ind],
            this.data[ind + 1],
            this.data[ind + 2]
        )
    }
}

export default Glacier
