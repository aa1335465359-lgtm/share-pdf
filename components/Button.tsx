import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Tomato Theme Colors
  const variants = {
    // Red/Tomato primary
    primary: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 focus:ring-red-400 border border-transparent active:scale-95",
    // Dark stone for secondary
    secondary: "bg-stone-800 hover:bg-stone-900 text-white shadow-lg shadow-stone-500/20 focus:ring-stone-500 border border-transparent",
    // Red outline
    outline: "bg-white hover:bg-red-50 text-red-600 border border-red-200 focus:ring-red-200",
    // Ghost red text
    ghost: "bg-transparent hover:bg-red-50 text-stone-600 hover:text-red-600"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};