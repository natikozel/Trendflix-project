interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-gray-800 text-gray-100 hover:bg-gray-700',
  outline: 'border border-gray-700 text-gray-100 hover:bg-gray-800'
};

export function Badge({ 
  children, 
  variant = 'primary',
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-3 py-1 text-sm font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-ring
        focus:ring-offset-2 cursor-default
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
} 