'use client'

import { Eye, EyeOff } from 'lucide-react'
import * as React from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, disabled, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false)

  return (
    <InputGroup className={className}>
      <InputGroupInput
        ref={ref}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-xs"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
})

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
