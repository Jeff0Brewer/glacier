import { useRef, useEffect, FC } from 'react'
import VisRenderer from '../vis/vis'
import styles from '../styles/app.module.css'

const App: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const frameIdRef = useRef<number>(-1)
    const visRef = useRef<VisRenderer | null>(null)

    useEffect(() => {
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

    return (
        <section>
            <canvas
                ref={canvasRef}
                className={styles.canvas}
                width={window.innerWidth * window.devicePixelRatio}
                height={window.innerHeight * window.devicePixelRatio}
            />
        </section>
    )
}

export default App
