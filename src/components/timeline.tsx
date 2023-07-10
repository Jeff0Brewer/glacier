import { useEffect, useRef, FC } from 'react'
import type { MutableRefObject } from 'react'

type TimelineProps = {
    timeRef: MutableRefObject<number>
}

const Timeline: FC<TimelineProps> = props => {
    const timeoutIdRef = useRef<number>(-1)

    useEffect(() => {
        const update = (): void => {
            console.log(props.timeRef.current)
            timeoutIdRef.current = window.setTimeout(update, 1000)
        }
        update()

        return () => {
            window.clearTimeout(timeoutIdRef.current)
        }
    }, [props.timeRef])
    return (
        <div>
            <div></div>
        </div>
    )
}

export default Timeline
