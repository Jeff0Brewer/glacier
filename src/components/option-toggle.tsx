import { FC } from 'react'
import type { FlowOptions, FlowOptionField } from '../lib/flow-calc'

type OptionToggleProps = {
    field: FlowOptionField,
    options: FlowOptions,
    setOptions: (options: FlowOptions) => void
}

const OptionToggle: FC<OptionToggleProps> = ({ field, options, setOptions }) => {
    return (
        <a onClick={(): void => {
            options[field] = !options[field]
            setOptions({ ...options })
        }}
        > {field} </a>
    )
}

export default OptionToggle
