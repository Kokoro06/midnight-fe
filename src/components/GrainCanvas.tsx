interface GrainCanvasProps {
  className?: string
  animate?: boolean
}

export default function GrainCanvas({ className = 'grain-canvas', animate = true }: GrainCanvasProps) {
  const finalClass = animate ? `${className} grain-flicker` : className
  return (
    <div
      className={finalClass}
      style={{
        backgroundImage: 'url(/grain.jpg)',
        backgroundRepeat: 'repeat',
        backgroundSize: '512px 288px',
      }}
    />
  )
}
