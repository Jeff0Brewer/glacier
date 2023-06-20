import { useRef, useEffect, FC } from 'react'
import { initProgram, initBuffer } from '../lib/gl-wrap'

const surfaceImg = '../../public/data/bedmap2_surface_rutford.png'

const getPlaneVerts = (width: number, height: number): Float32Array => {
    const verts = new Float32Array(999)
    let vertInd = 0
    const setStrip = (x: number, y: number, z: number): void => {
        verts[vertInd++] = x
        verts[vertInd++] = y
        verts[vertInd++] = z

        verts[vertInd++] = x + 1
        verts[vertInd++] = y
        verts[vertInd++] = z
    }

    for (let x = 0; x < width - 1; x++) {
        // alternate y increment direction for each column
        if (x % 2 === 0) {
            for (let y = 0; y < height; y++) {
                setStrip(x, y, 0)
            }
        } else {
            for (let y = height - 1; y >= 0; y--) {
                setStrip(x, y, 0)
            }
        }
    }

    return verts
}

const App: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)

    const initGl = async (canvas: HTMLCanvasElement): Promise<void> => {
        const gl = canvas.getContext('webgl')
        if (!gl) {
            throw new Error('WebGL context creation failed')
        }

        // init program
        const vertFile = '../shader/vert.glsl'
        const fragFile = '../shader/frag.glsl'
        const program = initProgram(gl, vertFile, fragFile)
        gl.useProgram(program)

        // init buffer
        const plane = getPlaneVerts(10, 10)
        const buffer = initBuffer(gl, plane, gl.STATIC_DRAW)

        // init attribs

        glRef.current = gl
    }

    useEffect(() => {
        if (canvasRef.current) {
            initGl(canvasRef.current)
        }
    }, [])

    return (
        <section>
            <canvas ref={canvasRef} />
        </section>
    )
}

export default App
