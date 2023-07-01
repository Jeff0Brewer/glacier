import { FC } from 'react'
import type { FlowOptions, FlowOptionField } from '../lib/flow-calc'
import styles from '../app.module.css'

type OptionToggleProps = {
    field: FlowOptionField,
    options: FlowOptions,
    setOptions: (options: FlowOptions) => void
}

const OptionToggle: FC<OptionToggleProps> = ({ field, options, setOptions }) => {
    return (
        <button
            className={options[field] ? styles.active : styles.inactive}
            onClick={(): void => {
                options[field] = !options[field]
                setOptions({ ...options })
            }}
        > {field} </button>
    )
}

export default OptionToggle
