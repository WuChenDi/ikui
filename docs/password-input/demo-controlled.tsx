'use client'

import { useState } from 'react'
import { PasswordInput } from '@/registry/ikui/password-input'

export function Demo() {
  const [value, setValue] = useState('')

  return (
    <div className="flex max-w-72 flex-col gap-2">
      <PasswordInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type a password"
      />
      <p className="text-muted-foreground text-sm">Length: {value.length}</p>
    </div>
  )
}
