import { useState, useRef, useEffect, FC } from 'react'
import type { MutableRefObject } from 'react'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import type { Marker, ColorMode } from '../vis/markers'
import { getColor } from '../vis/markers'
import VisRenderer from '../vis/vis'
import MarkerPlots from '../components/charts'
import styles from '../styles/vis.module.css'

type ClickMode = 'rotate' | 'pan' | 'mark' | 'worm'

type VisProps = {
    data: ModelData,
    options: FlowOptions,
    clickMode: ClickMode,
    surface: HTMLImageElement,
    texture: HTMLImageElement,
    timeRef: MutableRefObject<number>,
    speedRef: MutableRefObject<number>
}

const Vis: FC<VisProps> = props => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const [markers, setMarkers] = useState<Array<Marker>>([])
    const [currMarker, setCurrMarker] = useState<number>(-1)
    const [colorMode, setColorMode] = useState<ColorMode>('gray')
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

    // set click mode
    useEffect(() => {
        if (!visRef.current) { return }
        const removeHandlers = visRef.current.setClickMode(props.clickMode)
        return () => {
            if (removeHandlers) {
                removeHandlers()
            }
        }
    }, [props.clickMode])

    // add handler for marker placement mode
    useEffect(() => {
        if (props.clickMode !== 'mark' || !canvasRef.current) { return }

        const placeMarker = (e: MouseEvent): void => {
            if (!visRef.current) { return }
            // convert pixel coords to gl clip space
            const x = e.clientX / window.innerWidth * 2 - 1
            const y = (1 - e.clientY / window.innerHeight) * 2 - 1

            const position = visRef.current.unprojectMouse(x, y)
            if (position) {
                const marker: Marker = {
                    x: position[0],
                    y: position[1],
                    z: position[2],
                    color: getColor(colorMode, markers.length)
                }
                setMarkers([...markers, marker])
                setCurrMarker(markers.length)
            }
        }

        const canvas = canvasRef.current
        canvas.addEventListener('mousedown', placeMarker)

        return () => {
            canvas.removeEventListener('mousedown', placeMarker)
        }
    }, [markers, props.clickMode, colorMode])

    useEffect(() => {
        for (let i = 0; i < markers.length; i++) {
            markers[i].color = getColor(colorMode, i)
        }
        setMarkers([...markers])

        // disable exhaustive deps to exclude markers state
        // including markers would cause infinite loop
        // and colors to be reset on any marker addition / deletion
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [colorMode])

    // setup draw loop
    useEffect(() => {
        let lastT = 0
        const draw = (time: number): void => {
            if (!visRef.current) { return }

            time /= 1000
            const elapsed = time - lastT
            lastT = time
            // prevent large time updates after freeze / pause
            if (elapsed < 1) {
                props.timeRef.current += elapsed * props.speedRef.current
            }

            visRef.current.draw(props.data, props.options, props.timeRef.current, markers)
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)

        return (): void => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [props.data, props.options, props.timeRef, props.speedRef, markers])

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
                    colorMode={colorMode}
                    setColorMode={setColorMode}
                /> }
        </section>
    )
}

export default Vis

export type {
    ClickMode
}
