import { FC, MutableRefObject } from 'react'
import type { FlowOptions } from '../lib/flow-calc'
import type { ClickMode } from '../components/vis'
import { OptionToggle, ModeToggle } from '../components/toggles'
import Timeline from '../components/timeline'
import styles from '../styles/menu.module.css'

type MenuProps = {
    options: FlowOptions,
    clickMode: ClickMode,
    setOptions: (options: FlowOptions) => void,
    setClickMode: (clickMode: ClickMode) => void,
    timeRef: MutableRefObject<number>,
    speedRef: MutableRefObject<number>,
}

const Menu: FC<MenuProps> = ({ options, clickMode, setOptions, setClickMode, timeRef, speedRef }) => {
    return (
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
    )
}

export default Menu
