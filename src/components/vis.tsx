import { useState, useRef, useEffect, FC } from 'react'
import type { MutableRefObject } from 'react'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import type { Marker } from '../vis/markers'
import { markerColors } from '../vis/markers'
import VisRenderer from '../vis/vis'
import MarkerPlots from '../components/charts'
import styles from '../styles/vis.module.css'

type VisProps = {
    data: ModelData,
    options: FlowOptions,
    surface: HTMLImageElement,
    texture: HTMLImageElement,
    timeRef: MutableRefObject<number>
}

const Vis: FC<VisProps> = props => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const [markers, setMarkers] = useState<Array<Marker>>([])
    const [currMarker, setCurrMarker] = useState<number>(-1)
    const visRef = useRef<VisRenderer | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)

    const deleteMarker = (ind: number): void => {
        markers.splice(ind, 1)
        setMarkers([...markers])
        if (ind === markers.length) {
            setCurrMarker(ind - 1)
        }
    }

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

    // init vis renderer
    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, props.surface, props.texture)
            // setup handlers returns closure to cleanup handlers
            // return to useEffect to prevent accumulating excess handlers
            return visRef.current.setupEventHandlers(canvasRef.current)
        }
    }, [props.surface, props.texture])

    // recalculate flow on data / option changes
    useEffect(() => {
        if (visRef.current) {
            visRef.current.calcFlow(props.data, props.options)
        }
    }, [props.data, props.options])

    // setup draw loop
    useEffect(() => {
        const draw = (time: number): void => {
            time /= 1000
            if (visRef.current) {
                visRef.current.draw(props.data, props.options, time, markers)
            }
            props.timeRef.current = time
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)

        return (): void => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [props.data, props.options, props.timeRef, markers])

    // handle mouse interaction
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) { return }

        const mouseDown = (e: MouseEvent): void => {
            if (!visRef.current) { return }
            const x = e.clientX / window.innerWidth * 2.0 - 1.0
            const y = (1.0 - e.clientY / window.innerHeight) * 2.0 - 1.0
            if (e.shiftKey) {
                // convert pixel coords to gl clip space
                const position = visRef.current.unprojectMouse(x, y)
                if (position) {
                    const marker: Marker = {
                        x: position[0],
                        y: position[1],
                        z: position[2],
                        color: markerColors[markers.length % markerColors.length]
                    }
                    setMarkers([...markers, marker])
                    setCurrMarker(markers.length)
                }
            } else if (e.altKey) {
                visRef.current.placeWorms(x, y)
            }
        }
        canvas.addEventListener('mousedown', mouseDown)

        return (): void => {
            canvas.removeEventListener('mousedown', mouseDown)
        }
    }, [markers])

    return (
        <section>
            <canvas
                className={styles.canvas}
                ref={canvasRef}
                width={width * window.devicePixelRatio}
                height={height * window.devicePixelRatio}
                style={{ width: `${width}px`, height: `${height}px` }}
            />
            { markers[currMarker] &&
                <MarkerPlots
                    markers={markers}
                    currMarker={currMarker}
                    setCurrMarker={setCurrMarker}
                    deleteMarker={deleteMarker}
                    data={props.data}
                    options={props.options}
                /> }
        </section>
    )
}

export default Vis
