import { useState, useRef, useEffect, FC } from 'react'
import { loadDataset, loadImageAsync } from '../lib/data-load'
import VisRenderer from '../vis/vis'

const SURFACE_SRC = './data/bedmap2_surface_rutford_5px.png'

const App: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const frameIdRef = useRef<number>(-1)
    const [vis, setVis] = useState<VisRenderer | null>(null)

    const initVis = async (canvas: HTMLCanvasElement): Promise<void> => {
        const [data, surface] = await Promise.all([
            loadDataset(),
            loadImageAsync(SURFACE_SRC)
        ])
        setVis(new VisRenderer(canvas, data, surface))
    }

    useEffect(() => {
        if (!canvasRef.current) {
            throw new Error('No reference to visualization canvas')
        }
        initVis(canvasRef.current)

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)
    }, [])

    useEffect(() => {
        const draw = (): void => {
            if (!vis) { return }
            vis.draw()
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)

        return () => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [vis])

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
