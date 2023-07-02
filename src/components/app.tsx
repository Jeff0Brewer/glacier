import { useState, useEffect, FC } from 'react'
import { loadDataset, loadImageAsync } from '../lib/data-load'
import type { ModelData } from '../lib/data-load'
import type { FlowOptions } from '../lib/flow-calc'
import OptionToggle from '../components/option-toggle'
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
                <div>
                    <p>calc options</p>
                    <OptionToggle field={'vel'} options={options} setOptions={setOptions} />
                    <OptionToggle field={'p1'} options={options} setOptions={setOptions} />
                    <OptionToggle field={'p2'} options={options} setOptions={setOptions} />
                    <OptionToggle field={'p3'} options={options} setOptions={setOptions} />
                </div>
            </nav>
            { data && surface && texture &&
                <Vis data={data} options={options} surface={surface} texture={texture} />
            }
        </section>
    )
}

export default App
