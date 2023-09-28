import { Input } from '@/components/ui'
import { InputHTMLAttributes, useState, useEffect } from 'react'

interface DebouncedInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'size' | 'prefix'
  > {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
}

function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: DebouncedInputProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="flex justify-end">
      <div className="flex items-center">
        <Input
          {...props}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </div>
  )
}

export default DebouncedInput
