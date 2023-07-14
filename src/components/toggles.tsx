import { FC } from 'react'
import { ClickMode } from '../components/vis'
import { FlowOptions, FlowOptionField } from '../lib/flow-calc'

type ModeToggleProps = {
    mode: ClickMode,
    clickMode: ClickMode,
    setClickMode: (mode: ClickMode) => void
}

const ModeToggle: FC<ModeToggleProps> = ({ mode, clickMode, setClickMode }) => {
    const setMode = (): void => {
        setClickMode(mode)
    }

    return (
        <a onClick={setMode} data-active={clickMode === mode}>
            {mode}
        </a>
    )
}

type OptionToggleProps = {
    field: FlowOptionField,
    options: FlowOptions,
    setOptions: (op: FlowOptions) => void
}

const OptionToggle: FC<OptionToggleProps> = ({ options, setOptions, field }) => {
    const toggleOption = (): void => {
        options[field] = !options[field]
        setOptions({ ...options })
    }

    return (
        <a onClick={toggleOption} data-active={options[field]}>
            {field}
        </a>
    )
}

export {
    ModeToggle,
    OptionToggle
}
