import { useState, useRef, useEffect, FC } from 'react'
import { loadDataset, loadImageAsync } from '../lib/data-load'
import VisRenderer from '../vis/vis'
import type { VisMode } from '../vis/vis'
import type { FlowOptions } from '../lib/flow-calc'

const SURFACE_SRC = './data/bedmap2_surface_rutford_5px.png'
const VIS_MODES: Array<VisMode> = ['worm', 'flow']

const App: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const frameIdRef = useRef<number>(-1)
    const [vis, setVis] = useState<VisRenderer | null>(null)
    const [mode, setMode] = useState<number>(0)
    const [options, setOptions] = useState<FlowOptions>({
        vel: true,
        p1: true,
        p2: true,
        p3: true
    })

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
        const draw = (time: number): void => {
            if (!vis) { return }
            vis.draw(time / 1000)
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)

        return () => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [vis])

    useEffect(() => {
        if (vis) {
            vis.setMode(VIS_MODES[mode])
        }
    }, [vis, mode])

    useEffect(() => {
        if (vis) {
            vis.setOptions(options)
        }
    }, [vis, options])

    const resizeCanvas = (): void => {
        if (!canvasRef.current) { return }
        canvasRef.current.style.width = `${window.innerWidth}px`
        canvasRef.current.style.height = `${window.innerHeight}px`
        canvasRef.current.width = window.innerWidth * window.devicePixelRatio
        canvasRef.current.height = window.innerHeight * window.devicePixelRatio
    }

    const toggleMode = (): void => {
        setMode((mode + 1) % 2)
    }

    const toggleVel = (): void => {
        options.vel = !options.vel
        setOptions({ ...options })
    }

    const toggleP1 = (): void => {
        options.p1 = !options.p1
        setOptions({ ...options })
    }

    const toggleP2 = (): void => {
        options.p2 = !options.p2
        setOptions({ ...options })
    }

    const toggleP3 = (): void => {
        options.p3 = !options.p3
        setOptions({ ...options })
    }

    return (
        <section>
            <div>
                <p>vis mode</p>
                <button onClick={toggleMode}>
                    { VIS_MODES[mode] }
                </button>
            </div>
            <div>
                <p>calc options</p>
                <button onClick={toggleVel}>vel</button>
                <button onClick={toggleP1}>p1</button>
                <button onClick={toggleP2}>p2</button>
                <button onClick={toggleP3}>p3</button>
            </div>
            <canvas ref={canvasRef} />
        </section>
    )
}

export default App
