import * as React from 'react'

type AnyProps = Record<string, unknown>

function mergeRefs<T>(...refs: React.Ref<T>[]) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.RefObject<T | null>).current = node
    }
  }
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps }

  for (const key in childProps) {
    const slotValue = slotProps[key]
    const childValue = childProps[key]

    if (
      /^on[A-Z]/.test(key) &&
      typeof slotValue === 'function' &&
      typeof childValue === 'function'
    ) {
      merged[key] = (...args: unknown[]) => {
        ;(childValue as (...a: unknown[]) => unknown)(...args)
        ;(slotValue as (...a: unknown[]) => unknown)(...args)
      }
    } else if (
      key === 'className' &&
      typeof slotValue === 'string' &&
      typeof childValue === 'string'
    ) {
      merged[key] = [slotValue, childValue].filter(Boolean).join(' ')
    } else if (key === 'style') {
      merged[key] = { ...(slotValue as object), ...(childValue as object) }
    } else {
      merged[key] = childValue
    }
  }

  return merged
}

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

/**
 * Minimal `asChild` primitive: merges its props onto the single child element.
 * Zero-dependency `asChild` slot implementation.
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...props },
  ref,
) {
  if (!React.isValidElement(children)) {
    return null
  }

  const child = children as React.ReactElement<AnyProps>
  const childRef = (child as { ref?: React.Ref<HTMLElement> }).ref

  return React.cloneElement(child, {
    ...mergeProps(props as AnyProps, child.props),
    ref: ref ? mergeRefs(ref, childRef ?? null) : childRef,
  } as AnyProps)
})
