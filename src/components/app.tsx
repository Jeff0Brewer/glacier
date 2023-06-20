import { useState, useRef, useEffect, FC } from 'react'
import { mat4 } from 'gl-matrix'
import { initProgram, initBuffer, initAttribute } from '../lib/gl-wrap'
import styles from '../styles/app.module.css'

const getPlaneVerts = (width: number, height: number): Float32Array => {
    const verts = new Float32Array((width - 1) * height * 6)
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
    const [gl, setGl] = useState<WebGLRenderingContext | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const frameIdRef = useRef<number>(-1)
    const numVertRef = useRef<number>(-1)

    const initGl = async (canvas: HTMLCanvasElement): Promise<void> => {
        canvas.width = window.innerWidth * window.devicePixelRatio
        canvas.height = window.innerHeight * window.devicePixelRatio
        const gl = canvas.getContext('webgl')
        if (!gl) {
            throw new Error('WebGL context creation failed')
        }

        // init program
        const vertFile = './shaders/vert.glsl'
        const fragFile = './shaders/frag.glsl'
        const program = await initProgram(gl, vertFile, fragFile)

        // init buffer
        const plane = getPlaneVerts(10, 10)
        numVertRef.current = plane.length / 3
        const buffer = initBuffer(gl, plane, gl.STATIC_DRAW)

        // init attribs
        const bindPosition = initAttribute(gl, program, 'position', 3, 3, 0)

        // init uniforms
        const modelMatrix = mat4.create()
        const viewMatrix = mat4.lookAt(
            mat4.create(),
            [10, 10, 10],
            [0, 0, 0],
            [0, 0, 1]
        )
        const projMatrix = mat4.perspective(
            mat4.create(),
            1.5,
            window.innerWidth / window.innerHeight,
            0.1,
            50
        )
        const uModelMatrix = gl.getUniformLocation(program, 'modelMatrix')
        const uViewMatrix = gl.getUniformLocation(program, 'viewMatrix')
        const uProjMatrix = gl.getUniformLocation(program, 'projMatrix')
        gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix)
        gl.uniformMatrix4fv(uViewMatrix, false, viewMatrix)
        gl.uniformMatrix4fv(uProjMatrix, false, projMatrix)

        setGl(gl)
    }

    useEffect(() => {
        if (canvasRef.current) {
            initGl(canvasRef.current)
        }
    }, [])

    useEffect(() => {
        if (!gl) { return }
        const draw = (): void => {
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, numVertRef.current)
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)
        return () => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [gl])

    return (
        <section>
            <canvas className={styles.canvas} ref={canvasRef} />
        </section>
    )
}

export default App
