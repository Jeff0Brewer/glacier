import { useRef, useEffect, FC } from 'react'

const glacierSurfaceImg = '../../public/data/bedmap2_surface_rutford.png'

const App: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)

    const initGl = (canvas: HTMLCanvasElement): void => {
        const gl = canvas.getContext('webgl')
    }

    useEffect(() => {
        // get reference to gl context
        if (canvasRef.current) {
            glRef.current = canvasRef.current.getContext('webgl')
        }
    }, [])

    return (
        <section>
            <canvas ref={canvasRef} />
        </section>
    )
}

export default App
