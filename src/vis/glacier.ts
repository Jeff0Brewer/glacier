import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute, initTexture } from '../lib/gl-wrap'
import vertSource from '../shaders/glacier-vert.glsl?raw'
import fragSource from '../shaders/glacier-frag.glsl?raw'

// floats per vertex for attribs
const POS_FPV = 2
const TEX_FPV = 2
const ALL_FPV = POS_FPV + TEX_FPV

class Glacier {
    buffer: WebGLBuffer
    texture: WebGLTexture
    program: WebGLProgram
    numVertex: number
    bindPosition: () => void
    bindTexCoord: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void

    constructor (gl: WebGLRenderingContext) {
        this.program = initProgram(gl, vertSource, fragSource)
        this.buffer = initBuffer(gl)
        this.texture = initTexture(gl)
        this.bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        this.bindTexCoord = initAttribute(gl, this.program, 'texCoord', TEX_FPV, ALL_FPV, POS_FPV)
        this.numVertex = 0

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        this.setModelMatrix = (mat: mat4): void => {
            gl.uniformMatrix4fv(uModelMatrix, false, mat)
        }
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        this.setViewMatrix = (mat: mat4): void => {
            gl.uniformMatrix4fv(uViewMatrix, false, mat)
        }
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        this.setProjMatrix = (mat: mat4): void => {
            gl.uniformMatrix4fv(uProjMatrix, false, mat)
        }
    }

    async setSurface (gl: WebGLRenderingContext, imageSource: string): Promise<void> {
        const image = await loadImageAsync(imageSource)
        // set texture from image data
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        )
        // set vertices from image size
        const plane = getPlaneVerts(image.width, image.height)
        this.numVertex = plane.length / ALL_FPV
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bufferData(gl.ARRAY_BUFFER, plane, gl.STATIC_DRAW)
    }

    draw (gl: WebGLRenderingContext, modelMatrix: mat4): void {
        gl.useProgram(this.program)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)
        this.bindPosition()
        this.bindTexCoord()
        this.setModelMatrix(modelMatrix)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.numVertex)
    }
}

// from width and height, create plane triangle strip with position and tex coordinate attributes
const getPlaneVerts = (width: number, height: number): Float32Array => {
    // scale down dimensions, don't need a vertex at every image pixel
    width = Math.ceil(width / 4)
    height = Math.ceil(height / 4)

    const VERT_PER_POS = 2 // since drawing as triangle strip
    const verts = new Float32Array((width - 1) * height * VERT_PER_POS * ALL_FPV)

    let ind = 0
    const posScale = 1 / ((width + height) / 2)
    const posOffsetX = -width / 2
    const posOffsetY = -height / 2
    const texScaleX = 1 / (width - 1)
    const texScaleY = 1 / (height - 1)

    // helper to set swizzled attribs from xy position
    const setVert = (x: number, y: number): void => {
        // position in range (-0.5, 0.5)
        verts[ind++] = (x + posOffsetX) * posScale
        verts[ind++] = (y + posOffsetY) * posScale
        // tex coords in range (0, 1)
        verts[ind++] = 1 - x * texScaleX
        verts[ind++] = y * texScaleY
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

    return verts
}

// wrap image load event in promise for async use
const loadImageAsync = async (source: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.src = source
        image.addEventListener('load', (): void => {
            resolve(image)
        })
        image.addEventListener('error', (): void => {
            reject(new Error(`Failed to load image ${source}`))
        })
    })
}

export default Glacier
