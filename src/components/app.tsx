import { useState, useEffect, useRef, FC } from 'react'
import { loadDataset, loadImageAsync } from '../lib/data-load'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import type { ClickMode } from '../components/vis'
import { ModeToggle, OptionToggle } from '../components/toggles'
import Timeline from '../components/timeline'
import Vis from '../components/vis'
import styles from '../styles/app.module.css'

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
    const [clickMode, setClickMode] = useState<ClickMode>('rotate')
    const timeRef = useRef<number>(0)
    const speedRef = useRef<number>(1)

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

    return (
        <section>
            <nav className={styles.menu}>
                <img className={styles.contextImage} src='./ctx-img.jpg' />
                <div className={styles.interactions}>
                    <p className={styles.interactionLabel}>flow components</p>
                    <div className={styles.toggles}>
                        <OptionToggle field={'vel'} options={options} setOptions={setOptions} />
                        <OptionToggle field={'p1'} options={options} setOptions={setOptions} />
                        <OptionToggle field={'p2'} options={options} setOptions={setOptions} />
                        <OptionToggle field={'p3'} options={options} setOptions={setOptions} />
                    </div>
                    <p className={styles.interactionLabel}>click mode</p>
                    <div className={styles.toggles}>
                        <ModeToggle mode={'rotate'} clickMode={clickMode} setClickMode={setClickMode} />
                        <ModeToggle mode={'pan'} clickMode={clickMode} setClickMode={setClickMode} />
                        <ModeToggle mode={'mark'} clickMode={clickMode} setClickMode={setClickMode} />
                        <ModeToggle mode={'worm'} clickMode={clickMode} setClickMode={setClickMode} />
                    </div>
                    <p className={styles.interactionLabel}>timeline</p>
                    <Timeline timeRef={timeRef} speedRef={speedRef} />
                </div>
            </nav>
            { data && surface && texture &&
                <Vis
                    data={data}
                    options={options}
                    clickMode={clickMode}
                    surface={surface}
                    texture={texture}
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
