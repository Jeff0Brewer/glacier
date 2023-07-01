import { useState, useRef, useEffect, FC } from 'react'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import VisRenderer from '../vis/vis'

type VisProps = {
    data: ModelData,
    surface: HTMLImageElement,
    options: FlowOptions
}

const Vis: FC<VisProps> = props => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const visRef = useRef<VisRenderer | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)

    // setup resize handler
    useEffect(() => {
        window.addEventListener('resize', (): void => {
            setWidth(window.innerWidth)
            setHeight(window.innerHeight)
        })
    }, [])

    // init vis renderer, draw loop
    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, props.surface)
        }
        const draw = (): void => {
            if (visRef.current) { visRef.current.draw() }
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)
        return (): void => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [props.surface])

    // recalculate flow on data / options changes
    useEffect(() => {
        if (visRef.current) {
            visRef.current.calcFlow(props.data, props.options)
        }
    }, [props.options, props.data])

    return (
        <canvas
            ref={canvasRef}
            width={width * window.devicePixelRatio}
            height={height * window.devicePixelRatio}
            style={{ width: `${width}px`, height: `${height}px` }}
        />
    )
}

export default Vis
