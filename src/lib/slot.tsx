import type {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
} from 'react'
import { cloneElement, forwardRef, isValidElement } from 'react'

type AnyProps = Record<string, unknown>

function mergeRefs<T>(...refs: Ref<T>[]) {
  return (node: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as RefObject<T | null>).current = node
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

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode
}

/**
 * Minimal `asChild` primitive: merges its props onto the single child element.
 * Zero-dependency `asChild` slot implementation.
 */
export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, ...props },
  ref,
) {
  if (!isValidElement(children)) {
    return null
  }

  const child = children as ReactElement<AnyProps>
  const childRef = (child as { ref?: Ref<HTMLElement> }).ref

  return cloneElement(child, {
    ...mergeProps(props as AnyProps, child.props),
    ref: ref ? mergeRefs(ref, childRef ?? null) : childRef,
  } as AnyProps)
})
