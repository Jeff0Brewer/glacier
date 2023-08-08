import React, { FC, useState, useEffect } from 'react'
import styles from '../styles/dev-menu.module.css'

type DevMenuProps = {
    lineWidth: number,
    setLineWidth: (w: number) => void,
    density: number,
    setDensity: (d: number) => void
}

const DevMenu: FC<DevMenuProps> = ({ lineWidth, setLineWidth, density, setDensity }) => {
    const [visible, setVisible] = useState<boolean>(false)
    const [thisWidth, setThisWidth] = useState<number>(lineWidth)
    const [thisDensity, setThisDensity] = useState<number>(density)

    useEffect(() => {
        const toggleVisible = (e: KeyboardEvent): void => {
            if (e.ctrlKey && e.key === 'm') {
                setVisible(!visible)
            }
        }
        window.addEventListener('keypress', toggleVisible)
        return (): void => {
            window.removeEventListener('keypress', toggleVisible)
        }
    }, [visible])

    const updateLineWidth = (e: React.ChangeEvent): void => {
        if (e.target instanceof HTMLInputElement) {
            const value = parseFloat(e.target.value)
            if (value) {
                setThisWidth(value)
            }
        }
    }

    const updateDensity = (e: React.ChangeEvent): void => {
        if (e.target instanceof HTMLInputElement) {
            const value = parseFloat(e.target.value)
            if (value) {
                setThisDensity(value)
            }
        }
    }

    const recalc = (): void => {
        setDensity(thisDensity)
        setLineWidth(thisWidth)
    }

    if (!visible) { return <></> }
    return (
        <div className={styles.menu}>
            <p>line width</p>
            <span>
                <p>{thisWidth}</p>
                <input
                    type={'range'}
                    defaultValue={lineWidth}
                    min={0.001}
                    max={1}
                    step={0.001}
                    onChange={updateLineWidth}
                />
            </span>
            <p>density</p>
            <span>
                <p>{thisDensity}</p>
                <input
                    type={'range'}
                    defaultValue={density}
                    min={0.001}
                    max={0.4}
                    step={0.001}
                    onChange={updateDensity}
                />
            </span>
            <button onClick={recalc}>update</button>
        </div>
    )
}

export default DevMenu
