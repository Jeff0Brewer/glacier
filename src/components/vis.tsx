import { useState, useRef, useEffect, FC } from 'react'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type Marker = {
    x: number,
    y: number,
    z: number
}

type VisProps = {
    data: ModelData,
    options: FlowOptions,
    surface: HTMLImageElement,
    texture: HTMLImageElement
}

const Vis: FC<VisProps> = props => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const [markers, setMarkers] = useState<Array<Marker>>([])
    const visRef = useRef<VisRenderer | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)

    // setup resize handler
    useEffect(() => {
        const onResize = (): void => {
            setWidth(window.innerWidth)
            setHeight(window.innerHeight)
        }
        window.addEventListener('resize', onResize)
        return (): void => {
            window.removeEventListener('resize', onResize)
        }
    }, [])

    // init vis renderer, draw loop
    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, props.surface, props.texture)
        }
        const draw = (): void => {
            if (visRef.current) { visRef.current.draw() }
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)
        return (): void => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [props.data, props.surface, props.texture])

    // recalculate flow on option changes
    useEffect(() => {
        if (visRef.current) {
            visRef.current.calcFlow(props.data, props.options)
        }
    }, [props.data, props.options])

    // handle markers
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) { return }

        const addMarker = (e: MouseEvent): void => {
            if (visRef.current && e.shiftKey) {
                // convert pixel coords to gl clip space
                const x = e.clientX / window.innerWidth * 2.0 - 1.0
                const y = (1.0 - e.clientY / window.innerHeight) * 2.0 - 1.0
                const marker = visRef.current.mouseSelect(x, y)
                if (marker) {
                    setMarkers([...markers, marker])
                }
            }
        }
        canvas.addEventListener('mousedown', addMarker)

        return (): void => {
            canvas.removeEventListener('mousedown', addMarker)
        }
    }, [markers])

    return (
        <canvas
            className={styles.canvas}
            ref={canvasRef}
            width={width * window.devicePixelRatio}
            height={height * window.devicePixelRatio}
            style={{ width: `${width}px`, height: `${height}px` }}
        />
    )
}

export default Vis
