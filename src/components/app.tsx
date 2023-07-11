import { useState, useEffect, useRef, FC } from 'react'
import { loadDataset, loadImageAsync } from '../lib/data-load'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions, FlowOptionField } from '../lib/flow-calc'
import Timeline from '../components/timeline'
import Vis from '../components/vis'
import styles from '../styles/app.module.css'

const DATA_DIR = './data/model/'
const SURFACE_SRC = './data/bedmap2_surface_rutford_5px.png'
const TEXTURE_SRC = './data/surface-texture.png'

type ClickMode = 'rotate' | 'pan' | 'mark' | 'worm'

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

    const toggleOption = (field: FlowOptionField): void => {
        options[field] = !options[field]
        setOptions({ ...options })
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
                        <a
                            onClick={(): void => toggleOption('vel')}
                            data-active={options.vel}
                        >vel</a>
                        <a
                            onClick={(): void => toggleOption('p1')}
                            data-active={options.p1}
                        >p1</a>
                        <a
                            onClick={(): void => toggleOption('p2')}
                            data-active={options.p2}
                        >p2</a>
                        <a
                            onClick={(): void => toggleOption('p3')}
                            data-active={options.p3}
                        >p3</a>
                    </div>
                    <p className={styles.interactionLabel}>click mode</p>
                    <div className={styles.toggles}>
                        <a
                            onClick={(): void => setClickMode('rotate')}
                            data-active={clickMode === 'rotate'}
                        > rotate </a>
                        <a
                            onClick={(): void => setClickMode('pan')}
                            data-active={clickMode === 'pan'}
                        > pan </a>
                        <a
                            onClick={(): void => setClickMode('mark')}
                            data-active={clickMode === 'mark'}
                        > mark </a>
                        <a
                            onClick={(): void => setClickMode('worm')}
                            data-active={clickMode === 'worm'}
                        > worm </a>
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
