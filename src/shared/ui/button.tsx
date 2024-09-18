export function Button({ children, className, progress, ...props }: React.PropsWithChildren<{
  progress?: number
}> & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      className={`relative overflow-clip ${className ?? ''}`}
      {...props}
    >
      {children}
      <span
        className='bg-blue-600 h-1 absolute bottom-0 left-0'
        style={{ width: `${(progress ?? 0) * 100}%` }}
      />
    </button>
  )
}