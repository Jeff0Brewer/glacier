import { FC, ReactElement } from 'react'
import { ClickMode } from '../components/vis'
import { FlowOptions, FlowOptionField } from '../lib/flow-calc'

type ModeToggleProps = {
    mode: ClickMode,
    clickMode: ClickMode,
    setClickMode: (mode: ClickMode) => void,
    children?: ReactElement
}

const ModeToggle: FC<ModeToggleProps> = ({ mode, clickMode, setClickMode, children }) => {
    const setMode = (): void => {
        setClickMode(mode)
    }

    return (
        <button onClick={setMode} data-active={clickMode === mode}>
            {mode}
            {children}
        </button>
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
        <button onClick={toggleOption} data-active={options[field]}>
            {field}
        </button>
    )
}

export {
    ModeToggle,
    OptionToggle
}
