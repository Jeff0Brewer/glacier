import { useEffect, useRef, FC } from 'react'
import type { ChangeEvent, MutableRefObject } from 'react'
import { PERIOD_1, PERIOD_2, PERIOD_3 } from '../lib/flow-calc'
import styles from '../styles/timeline.module.css'

type TimelineProps = {
    timeRef: MutableRefObject<number>,
    speedRef: MutableRefObject<number>
}

const updateBarWidth = (bar: HTMLDivElement | null, time: number, maxTime: number): void => {
    if (!bar) { return }
    const modTime = time % maxTime
    bar.style.width = `${modTime / maxTime * 100}%`
}

const Timeline: FC<TimelineProps> = props => {
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
            props.timeRef.current = maxPeriod * xPercentage
            updateBarWidth(barRef.current, props.timeRef.current, maxPeriod)
        }
        timeline.addEventListener('mousedown', onClick)

        return () => {
            timeline.removeEventListener('mousedown', onClick)
        }
    }, [props.timeRef, maxPeriod])

    useEffect(() => {
        const update = (): void => {
            updateBarWidth(barRef.current, props.timeRef.current, maxPeriod)
            timeoutIdRef.current = window.setTimeout(update, 1000)
        }
        update()

        return () => {
            window.clearTimeout(timeoutIdRef.current)
        }
    }, [props.timeRef, maxPeriod])

    const inputSpeed = (e: ChangeEvent<HTMLInputElement>): void => {
        props.speedRef.current = parseFloat(e.target.value)
    }

    return (
        <div>
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
