import { useState, useRef, useEffect, FC } from 'react'
import type { MutableRefObject } from 'react'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import type { Marker, ColorMode } from '../vis/markers'
import { getColor } from '../vis/markers'
import Menu from '../components/menu'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type ClickMode = 'rotate' | 'pan' | 'mark' | 'worm'

type VisProps = {
    data: ModelData,
    surface: HTMLImageElement,
    texture: HTMLImageElement,
    options: FlowOptions,
    markers: Array<Marker>,
    setMarkers: (markers: Array<Marker>) => void,
    setCurrMarker: (ind: number) => void,
    setClickMode: (mode: ClickMode) => void,
    setOptions: (options: FlowOptions) => void,
    clickMode: ClickMode,
    colorMode: ColorMode,
    timeRef: MutableRefObject<number>,
    speedRef: MutableRefObject<number>
}

const Vis: FC<VisProps> = ({
    data, surface, texture, options, markers, setMarkers, setCurrMarker,
    setClickMode, setOptions, clickMode, colorMode, timeRef, speedRef
}) => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
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

    // init vis renderer
    useEffect(() => {
        if (canvasRef.current) {
            visRef.current = new VisRenderer(canvasRef.current, surface, texture)
            // setup handlers returns closure to cleanup handlers
            // return to useEffect to prevent accumulating excess handlers
            return visRef.current.setupEventHandlers(canvasRef.current)
        }
    }, [surface, texture])

    // recalculate flow on data / option changes
    useEffect(() => {
        if (visRef.current) {
            visRef.current.calcFlow(data, options)
        }
    }, [data, options])

    // set click mode
    useEffect(() => {
        if (!visRef.current) { return }
        const removeHandlers = visRef.current.setClickMode(clickMode)
        return () => {
            if (removeHandlers) {
                removeHandlers()
            }
        }
    }, [clickMode])

    // add handler for marker placement mode
    useEffect(() => {
        if (clickMode !== 'mark' || !canvasRef.current) { return }

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
    }, [markers, clickMode, colorMode, setCurrMarker, setMarkers])

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
                timeRef.current += elapsed * speedRef.current
            }

            visRef.current.draw(data, options, timeRef.current, markers)
            frameIdRef.current = window.requestAnimationFrame(draw)
        }
        frameIdRef.current = window.requestAnimationFrame(draw)

        return (): void => {
            window.cancelAnimationFrame(frameIdRef.current)
        }
    }, [data, options, timeRef, speedRef, markers])

    return (
        <section>
            <Menu
                options={options}
                clickMode={clickMode}
                setOptions={setOptions}
                setClickMode={setClickMode}
                timeRef={timeRef}
                speedRef={speedRef}
            />
            <canvas
                className={styles.canvas}
                ref={canvasRef}
                width={width * window.devicePixelRatio}
                height={height * window.devicePixelRatio}
                style={{ width: `${width}px`, height: `${height}px` }}
            />
        </section>
    )
}

export default Vis

export type {
    ClickMode
}
