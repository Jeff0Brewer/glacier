import { mat4, vec3 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import { getIcosphere } from '../lib/icosphere'
import vertSource from '../shaders/marker-base-vert.glsl?raw'
import fragSource from '../shaders/marker-base-frag.glsl?raw'

type Marker = {
    x: number,
    y: number,
    z: number,
    color: vec3
}

const POS_FPV = 3
const NRM_FPV = 3
const ALL_FPV = POS_FPV + NRM_FPV

class MarkerBase {
    program: WebGLProgram
    buffer: WebGLBuffer
    bindAttrib: () => void
    setModelMatrix: (mat: mat4) => void
    setViewMatrix: (mat: mat4) => void
    setProjMatrix: (mat: mat4) => void
    setMarkerPos: (x: number, y: number, z: number) => void
    numVertex: number

    constructor (
        gl: WebGLRenderingContext,
        model: mat4,
        view: mat4,
        proj: mat4,
        scale: mat4
    ) {
        this.program = initProgram(gl, vertSource, fragSource)
        this.buffer = initBuffer(gl)
        this.numVertex = 0

        const bindPosition = initAttribute(gl, this.program, 'position', POS_FPV, ALL_FPV, 0)
        const bindNormal = initAttribute(gl, this.program, 'normal', NRM_FPV, ALL_FPV, POS_FPV)
        this.bindAttrib = (): void => {
            bindPosition()
            bindNormal()
        }

        const uModelMatrix = gl.getUniformLocation(this.program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(this.program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(this.program, 'projMatrix')
        const uScaleMatrix = gl.getUniformLocation(this.program, 'scaleMatrix')
        const uMarkerPos = gl.getUniformLocation(this.program, 'markerPos')

        gl.uniformMatrix4fv(uModelMatrix, false, model)
        gl.uniformMatrix4fv(uViewMatrix, false, view)
        gl.uniformMatrix4fv(uProjMatrix, false, proj)
        gl.uniformMatrix4fv(uScaleMatrix, false, scale)

        this.setModelMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uModelMatrix, false, mat) }
        this.setViewMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uViewMatrix, false, mat) }
        this.setProjMatrix = (mat: mat4): void => { gl.uniformMatrix4fv(uProjMatrix, false, mat) }
        this.setMarkerPos = (x: number, y: number, z: number): void => {
            gl.uniform3f(uMarkerPos, x, y, z)
        }
    }

    draw (gl: WebGLRenderingContext, marker: Marker, vel: vec3): void {
        // TODO
    }
}

const getBaseVerts = (radius: number): Float32Array => {
    const ico = getIcosphere(2)
    // remove triangles with vertices at z < 0
    // since only need hemisphere
    ico.triangles.filter(t => {
        const v0 = ico.vertices[t[0]]
        const v1 = ico.vertices[t[1]]
        const v2 = ico.vertices[t[2]]
        return v0[2] > 0 && v1[2] > 0 && v2[2] > 0
    })

    const vert = new Float32Array(9999)
    let ind = 0
    const setVert = (
        x: number, y: number, z: number,
        nx: number, ny: number, nz: number
    ): void => {
        vert[ind++] = x
        vert[ind++] = y
        vert[ind++] = z
        vert[ind++] = nx
        vert[ind++] = ny
        vert[ind++] = nz
    }

    for (let ti = 0; ti < ico.triangles.length; ti++) {
        for (let vi = 0; vi < 3; vi++) {
            const [x, y, z] = ico.vertices[ico.triangles[ti][vi]]
            setVert(
                x * radius,
                y * radius,
                z * radius,
                x,
                y,
                z
            )
        }
    }
}

export default MarkerBase
