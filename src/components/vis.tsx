import { useState, useRef, useEffect, FC } from 'react'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type VisProps = {
    data: ModelData,
    options: FlowOptions,
    surface: HTMLImageElement,
    texture: HTMLImageElement
}

const Vis: FC<VisProps> = props => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const visRef = useRef<VisRenderer | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)

    // setup event handlers
    useEffect(() => {
        const onResize = (): void => {
            setWidth(window.innerWidth)
            setHeight(window.innerHeight)
        }
        window.addEventListener('resize', onResize)
        const onMouseDown = (e: MouseEvent): void => {
            if (visRef.current) {
                // convert pixel coords to gl clip space
                const x = e.clientX / window.innerWidth * 2.0 - 1.0
                const y = (1.0 - e.clientY / window.innerHeight) * 2.0 - 1.0
                visRef.current.mouseSelect(x, y)
            }
        }
        const canvas = canvasRef.current
        if (canvas) {
            canvas.addEventListener('mousedown', onMouseDown)
        }

        return (): void => {
            window.removeEventListener('resize', onResize)
            if (canvas) {
                canvas.removeEventListener('mousedown', onMouseDown)
            }
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
