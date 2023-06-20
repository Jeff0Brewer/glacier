import { useRef, useEffect, FC } from 'react'

const App: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)

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
