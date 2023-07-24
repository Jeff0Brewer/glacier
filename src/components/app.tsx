import { useState, useEffect, useRef, FC } from 'react'
import { loadDataset, loadImageAsync } from '../lib/data-load'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import type { ClickMode } from '../components/vis'
import type { Marker, ColorMode } from '../vis/markers'
import Menu from '../components/menu'
import MarkerPlots, { ALL_MARKER_IND } from '../components/charts'
import Vis from '../components/vis'

const DATA_DIR = './data/model/'
const SURFACE_SRC = './data/bedmap2_surface_rutford_5px.png'
const TEXTURE_SRC = './data/surface-texture.png'

const App: FC = () => {
    const [data, setData] = useState<ModelData | null>(null)
    const [surface, setSurface] = useState<HTMLImageElement | null>(null)
    const [texture, setTexture] = useState<HTMLImageElement | null>(null)
    const [options, setOptions] = useState<FlowOptions>({
        vel: true, p1: true, p2: true, p3: true
    })
    const [markers, setMarkers] = useState<Array<Marker>>([])
    const [currMarker, setCurrMarker] = useState<number>(-1)
    const [colorMode, setColorMode] = useState<ColorMode>('gray')

    const timeRef = useRef<number>(0)
    const speedRef = useRef<number>(1)

    const [clickMode, setClickMode] = useState<ClickMode>('rotate')
    const lastSelectedClickModeRef = useRef<ClickMode>(clickMode)

    const deleteMarker = (ind: number): void => {
        markers.splice(ind, 1)
        setMarkers([...markers])
        if (ind === markers.length) {
            setCurrMarker(ind - 1)
        }
    }

    const getData = async (): Promise<void> => {
        const [data, surface, texture] = await Promise.all([
            loadDataset(DATA_DIR),
            loadImageAsync(SURFACE_SRC),
            loadImageAsync(TEXTURE_SRC)
        ])
        setData(data)
        setSurface(surface)
        setTexture(texture)
    }

    useEffect(() => {
        getData()
    }, [])

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

    // store last click mode selected from interface to revert
    // back to on modifier key release
    const selectClickMode = (mode: ClickMode): void => {
        lastSelectedClickModeRef.current = mode
        setClickMode(mode)
    }

    if (!data) { return <></> }
    return (
        <section>
            { (markers[currMarker] || currMarker === ALL_MARKER_IND) &&
                <MarkerPlots
                    markers={markers}
                    currMarker={currMarker}
                    setCurrMarker={setCurrMarker}
                    deleteMarker={deleteMarker}
                    data={data}
                    options={options}
                    colorMode={colorMode}
                    setColorMode={setColorMode}
                />
            }
            { surface && texture &&
                <Vis
                    data={data}
                    surface={surface}
                    texture={texture}
                    options={options}
                    markers={markers}
                    setMarkers={setMarkers}
                    setCurrMarker={setCurrMarker}
                    setClickMode={selectClickMode}
                    setOptions={setOptions}
                    clickMode={clickMode}
                    colorMode={colorMode}
                    timeRef={timeRef}
                    speedRef={speedRef}
                />
            }
        </section>
    )
}

export default App

export type {
    ClickMode
}
