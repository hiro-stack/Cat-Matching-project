import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = "",
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    fullWidth = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    
    // Base styles
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    
    // Variant styles
    const variants = {
      primary: "bg-gradient-to-r from-pink-500 to-pink-400 text-white shadow-md hover:shadow-lg hover:from-pink-600 hover:to-pink-500",
      secondary: "bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900",
      outline: "border-2 border-pink-200 bg-transparent hover:bg-pink-50 text-pink-600",
      ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
      link: "text-pink-500 underline-offset-4 hover:underline p-0 h-auto",
    };

    // Size styles
    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-10 w-10",
    };

    const widthStyles = fullWidth ? "w-full" : "";
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyles} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
