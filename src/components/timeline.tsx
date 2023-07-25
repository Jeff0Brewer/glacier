import { useEffect, useRef, FC } from 'react'
import type { ChangeEvent, MutableRefObject } from 'react'
import { PERIOD_1, PERIOD_2, PERIOD_3 } from '../lib/flow-calc'
import styles from '../styles/timeline.module.css'

const updateBarWidth = (bar: HTMLDivElement | null, time: number, maxTime: number): void => {
    if (!bar) { return }
    const modTime = time % maxTime
    bar.style.width = `${modTime / maxTime * 100}%`
}

type TimelineProps = {
    timeRef: MutableRefObject<number>,
    speedRef: MutableRefObject<number>
}

const Timeline: FC<TimelineProps> = ({ timeRef, speedRef }) => {
    const barRef = useRef<HTMLDivElement>(null)
    const timelineRef = useRef<HTMLDivElement>(null)
    const timeoutIdRef = useRef<number>(-1)
    const maxPeriod = Math.max(PERIOD_1, PERIOD_2, PERIOD_3)

    useEffect(() => {
        const timeline = timelineRef.current
        if (!timeline || !barRef.current) { return }

        const onClick = (e: MouseEvent): void => {
            const rect = timeline.getBoundingClientRect()
            const xPercentage = (e.clientX - rect.left) / rect.width
            timeRef.current = maxPeriod * xPercentage
            updateBarWidth(barRef.current, timeRef.current, maxPeriod)
        }
        timeline.addEventListener('mousedown', onClick)

        return () => {
            timeline.removeEventListener('mousedown', onClick)
        }
    }, [timeRef, maxPeriod])

    useEffect(() => {
        // update bar width in timeout to get value
        // from ref instead of constant state updates
        const update = (): void => {
            updateBarWidth(barRef.current, timeRef.current, maxPeriod)
            timeoutIdRef.current = window.setTimeout(update, 1000)
        }
        update()
        return () => {
            window.clearTimeout(timeoutIdRef.current)
        }
    }, [timeRef, maxPeriod])

    const inputSpeed = (e: ChangeEvent<HTMLInputElement>): void => {
        const speed = parseFloat(e.target.value)
        if (!Number.isNaN(speed) && speed > 0) {
            speedRef.current = speed
        }
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.barWrap}>
                <div className={styles.timeline} ref={timelineRef}>
                    <div className={styles.timelineBar} ref={barRef}></div>
                </div>
                <div className={styles.bounds}>
                    <p>0</p>
                    <p>{Math.round(maxPeriod)}</p>
                </div>
            </div>
            <div className={styles.speedWrap}>
                <input type={'text'} defaultValue={1} onChange={inputSpeed}/>
                <p>hr / sec</p>
            </div>
        </div>
    )
}

export default Timeline
