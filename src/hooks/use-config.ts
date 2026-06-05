import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Config = {
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
}

type ConfigStore = {
  config: Config
  setConfig: (config: Config) => void
}

const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: { packageManager: 'pnpm' },
      setConfig: (config) => set({ config }),
    }),
    { name: 'ikui-config' },
  ),
)

export function useConfig() {
  const config = useConfigStore((s) => s.config)
  const setConfig = useConfigStore((s) => s.setConfig)
  return [config, setConfig] as const
}
