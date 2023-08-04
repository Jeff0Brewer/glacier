import React, { FC, useState, useEffect, useRef } from 'react'

type DevMenuProps = {
    lineWidth: number,
    setLineWidth: (w: number) => void,
    density: number,
    setDensity: (d: number) => void
}

const DevMenu: FC<DevMenuProps> = ({ lineWidth, setLineWidth, density, setDensity }) => {
    const [visible, setVisible] = useState<boolean>(false)
    const widthRef = useRef<number>(lineWidth)
    const densityRef = useRef<number>(density)

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
                widthRef.current = value
            }
        }
    }

    const updateDensity = (e: React.ChangeEvent): void => {
        if (e.target instanceof HTMLInputElement) {
            const value = parseFloat(e.target.value)
            if (value) {
                densityRef.current = value
            }
        }
    }

    const recalc = (): void => {
        setDensity(densityRef.current)
        setLineWidth(widthRef.current)
    }

    if (!visible) { return <></> }
    return (
        <div style={{ position: 'absolute', top: '0', right: '0', zIndex: '999' }}>
            <p>line width</p>
            <input type={'text'} defaultValue={lineWidth} onChange={updateLineWidth} />
            <p>density</p>
            <input type={'text'} defaultValue={density} onChange={updateDensity} />
            <br/>
            <button onClick={recalc}>update</button>
        </div>
    )
}

export default DevMenu
