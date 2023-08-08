import { useState, useRef, useEffect, FC } from 'react'
import type { MutableRefObject } from 'react'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import type { Marker, ColorMode } from '../vis/markers'
import { getColor } from '../vis/markers'
import Menu from '../components/menu'
import DevMenu from '../components/dev-menu'
import VisRenderer from '../vis/vis'
import styles from '../styles/vis.module.css'

type ClickMode = 'rotate' | 'pan' | 'mark' | 'worm'
type WormMode = 'persist' | 'single'

type VisProps = {
    data: ModelData,
    surface: HTMLImageElement,
    texture: HTMLImageElement,
    options: FlowOptions,
    setOptions: (options: FlowOptions) => void,
    markers: Array<Marker>,
    setMarkers: (markers: Array<Marker>) => void,
    setCurrMarker: (ind: number) => void,
    colorMode: ColorMode,
    timeRef: MutableRefObject<number>,
    speedRef: MutableRefObject<number>
}

const Vis: FC<VisProps> = ({
    data, surface, texture, options, setOptions, markers,
    setMarkers, setCurrMarker, colorMode, timeRef, speedRef
}) => {
    const [width, setWidth] = useState<number>(window.innerWidth)
    const [height, setHeight] = useState<number>(window.innerHeight)
    const [wormMode, setWormMode] = useState<WormMode>('single')
    const [clickMode, setClickMode] = useState<ClickMode>('rotate')
    const lastSelectedClickModeRef = useRef<ClickMode>(clickMode)
    const visRef = useRef<VisRenderer | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const frameIdRef = useRef<number>(-1)

    const [lineWidth, setLineWidth] = useState<number>(0.3)
    const [density, setDensity] = useState<number>(0.07)
    const [grayscaleTexture, setGrayscaleTexture] = useState<boolean>(false)
    const [flowColor0, setFlowColor0] = useState<string>('66b2e6')
    const [flowColor1, setFlowColor1] = useState<string>('333333')

    // store last click mode selected from interface to revert
    // back to on modifier key release
    const selectClickMode = (mode: ClickMode): void => {
        lastSelectedClickModeRef.current = mode
        setClickMode(mode)
    }

    const clearWorms = (): void => {
        if (visRef.current) {
            visRef.current.clearWorms()
        }
    }

    const placeMarkerWorms = (): void => {
        if (visRef.current) {
            for (const marker of markers) {
                visRef.current.placeWorm(marker.x, marker.y, wormMode)
            }
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
            visRef.current = new VisRenderer(canvasRef.current, surface, texture)
            // setup handlers returns closure to cleanup handlers
            // return to useEffect to prevent accumulating excess handlers
            return visRef.current.setupEventHandlers(canvasRef.current)
        }
    }, [surface, texture])

    // setup grayscale texture toggle
    useEffect(() => {
        if (!visRef.current) { return }
        visRef.current.setTexture(
            grayscaleTexture
                ? surface
                : texture
        )
        const toggleTexture = (e: KeyboardEvent): void => {
            if (e.ctrlKey && e.key === 'n') {
                setGrayscaleTexture(!grayscaleTexture)
            }
        }

        window.addEventListener('keypress', toggleTexture)
        return (): void => {
            window.removeEventListener('keypress', toggleTexture)
        }
    }, [surface, texture, grayscaleTexture])

    // pass flow colors into vis renderer on change
    useEffect(() => {
        if (visRef.current) {
            visRef.current.setFlowColors(flowColor0, flowColor1)
        }
    }, [flowColor0, flowColor1])

    // recalculate flow on data / option changes
    useEffect(() => {
        if (visRef.current) {
            visRef.current.calcFlow(data, options, lineWidth, density)
        }
    }, [data, options, lineWidth, density])

    // set modes in vis renderer on state changes
    useEffect(() => {
        if (!visRef.current) { return }
        const removeHandlers = visRef.current.setClickMode(clickMode, wormMode)
        return () => {
            // vis renderer setClickMode returns null on marker mode
            // since markers handled seperately
            if (removeHandlers) {
                removeHandlers()
            }
        }
    }, [clickMode, wormMode])

    // add handler for marker placement mode
    useEffect(() => {
        const canvas = canvasRef.current
        if (clickMode !== 'mark' || !canvas) { return }

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

        canvas.addEventListener('mousedown', placeMarker)
        return () => {
            canvas.removeEventListener('mousedown', placeMarker)
        }
    }, [markers, clickMode, colorMode, setCurrMarker, setMarkers])

    // set click mode with modifier keys
    useEffect(() => {
        const keyDown = (e: KeyboardEvent): void => {
            switch (e.key) {
                case ' ':
                    setClickMode('pan')
                    break
                case 'Shift':
                    setClickMode('rotate')
                    break
                case 'q':
                    setClickMode('mark')
                    break
                case 'w':
                    setClickMode('worm')
            }
        }
        const keyUp = (e: KeyboardEvent): void => {
            if ([' ', 'Shift', 'q', 'w'].includes(e.key)) {
                setClickMode(lastSelectedClickModeRef.current)
            }
        }

        window.addEventListener('keydown', keyDown)
        window.addEventListener('keyup', keyUp)
        return (): void => {
            window.removeEventListener('keydown', keyDown)
            window.removeEventListener('keyup', keyUp)
        }
    }, [])

    // update marker colors on color mode toggle
    useEffect(() => {
        for (let i = 0; i < markers.length; i++) {
            markers[i].color = getColor(colorMode, i)
        }
        setMarkers([...markers])

        // disable exhaustive deps to exclude markers state
        // including markers would cause infinite loop
        // and colors to be reset on any marker state change

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
                setClickMode={selectClickMode}
                wormMode={wormMode}
                setWormMode={setWormMode}
                clearWorms={clearWorms}
                placeMarkerWorms={placeMarkerWorms}
                timeRef={timeRef}
                speedRef={speedRef}
            />
            <DevMenu
                lineWidth={lineWidth}
                setLineWidth={setLineWidth}
                density={density}
                setDensity={setDensity}
                color0={flowColor0}
                setColor0={setFlowColor0}
                color1={flowColor1}
                setColor1={setFlowColor1}
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
    ClickMode,
    WormMode
}
