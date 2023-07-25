import { useState, useEffect, useRef, FC, MutableRefObject } from 'react'
import { FaCaretRight, FaCaretLeft } from 'react-icons/fa'
import type { FlowOptions } from '../lib/flow-calc'
import type { ClickMode, WormMode } from '../components/vis'
import { OptionToggle, ModeToggle } from '../components/toggles'
import Timeline from '../components/timeline'
import styles from '../styles/menu.module.css'

type MenuProps = {
    options: FlowOptions,
    setOptions: (options: FlowOptions) => void,
    clickMode: ClickMode,
    setClickMode: (clickMode: ClickMode) => void,
    wormMode: WormMode,
    setWormMode: (mode: WormMode) => void,
    clearWorms: () => void,
    placeMarkerWorms: () => void,
    timeRef: MutableRefObject<number>,
    speedRef: MutableRefObject<number>,
}

const Menu: FC<MenuProps> = ({
    options, setOptions, clickMode, setClickMode, wormMode,
    setWormMode, clearWorms, placeMarkerWorms, timeRef, speedRef
}) => {
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
                    <ModeToggle mode={'worm'} clickMode={clickMode} setClickMode={setClickMode}>
                        <WormMenu
                            wormMode={wormMode}
                            setWormMode={setWormMode}
                            clearWorms={clearWorms}
                            placeMarkerWorms={placeMarkerWorms}
                        />
                    </ModeToggle>
                </div>
                <p className={styles.interactionLabel}>timeline</p>
                <Timeline timeRef={timeRef} speedRef={speedRef} />
            </div>
        </nav>
    )
}

type WormMenuProps = {
    wormMode: WormMode,
    setWormMode: (mode: WormMode) => void,
    clearWorms: () => void,
    placeMarkerWorms: () => void
}

const WormMenu: FC<WormMenuProps> = ({ wormMode, setWormMode, clearWorms, placeMarkerWorms }) => {
    const [open, setOpen] = useState<boolean>(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const close = (e: MouseEvent): void => {
            if (!dropdownRef.current || !(e.target instanceof Element)) {
                return
            }
            if (!dropdownRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        window.addEventListener('mousedown', close)
        return (): void => {
            window.removeEventListener('mousedown', close)
        }
    }, [])

    const toggleWormMode = (): void => {
        setWormMode(wormMode === 'persist' ? 'single' : 'persist')
    }

    return (
        <div className={styles.wormMenu}>
            <a className={styles.wormArrow} onClick={(): void => setOpen(!open)}>
                { open ? <FaCaretLeft /> : <FaCaretRight /> }
            </a>
            { open &&
                <div className={styles.wormDropdown} ref={dropdownRef}>
                    <a onClick={toggleWormMode}>{wormMode}</a>
                    <a onClick={placeMarkerWorms}>on markers</a>
                    <a onClick={clearWorms}>clear all</a>
                </div> }
        </div>
    )
}

export default Menu
