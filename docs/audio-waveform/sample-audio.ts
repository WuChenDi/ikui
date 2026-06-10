/** Synthesizes a short 3s WAV blob for audio demos. */
export function createSampleBlob(): Blob {
  const sampleRate = 44100
  const duration = 3
  const length = sampleRate * duration
  const samples = new Float32Array(length)

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate
    const envelope = Math.abs(Math.sin(t * 3)) * (0.5 + 0.5 * Math.sin(t * 11))
    samples[i] = Math.sin(2 * Math.PI * 220 * t) * envelope
  }

  const buffer = new ArrayBuffer(44 + length * 2)
  const view = new DataView(buffer)
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length * 2, true)

  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, sample * 0x7fff, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}
