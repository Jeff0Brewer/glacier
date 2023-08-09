import React, { FC, useState, useEffect } from 'react'
import styles from '../styles/dev-menu.module.css'

type DevMenuProps = {
    lineWidth: number,
    setLineWidth: (w: number) => void,
    density: number,
    setDensity: (d: number) => void,
    color0: string,
    setColor0: (c: string) => void,
    color1: string,
    setColor1: (c: string) => void,
}

const DevMenu: FC<DevMenuProps> = ({
    lineWidth, setLineWidth, density, setDensity,
    color0, setColor0, color1, setColor1
}) => {
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

    const updateColor0 = (e: React.ChangeEvent): void => {
        if (e.target instanceof HTMLInputElement) {
            const value = e.target.value
            if (value.length === 6) {
                setColor0(value)
            }
        }
    }

    const updateColor1 = (e: React.ChangeEvent): void => {
        if (e.target instanceof HTMLInputElement) {
            const value = e.target.value
            if (value.length === 6) {
                setColor1(value)
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
            <p>flow color 0</p>
            <span>
                <div style={{ backgroundColor: `#${color0}` }}></div>
                <input
                    type={'text'}
                    defaultValue={color0}
                    onChange={updateColor0}
                />
            </span>
            <p>flow color 1</p>
            <span>
                <div style={{ backgroundColor: `#${color1}` }}></div>
                <input
                    type={'text'}
                    defaultValue={color1}
                    onChange={updateColor1}
                />
            </span>
            <button onClick={recalc}>update</button>
        </div>
    )
}

export default DevMenu
