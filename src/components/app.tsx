import { useRef, useEffect, FC } from 'react'
import VisRenderer from '../vis/vis'

const App: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const frameIdRef = useRef<number>(-1)
    const visRef = useRef<VisRenderer | null>(null)

    useEffect(() => {
        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current)
        }
        const draw = (): void => {
            if (!visRef.current) { return }
            visRef.current.draw()
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)

        return () => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [])

    const resizeCanvas = (): void => {
        if (!canvasRef.current) { return }
        canvasRef.current.style.width = `${window.innerWidth}px`
        canvasRef.current.style.height = `${window.innerHeight}px`
        canvasRef.current.width = window.innerWidth * window.devicePixelRatio
        canvasRef.current.height = window.innerHeight * window.devicePixelRatio
    }

    return (
        <section>
            <canvas ref={canvasRef} />
        </section>
    )
}

export default App
