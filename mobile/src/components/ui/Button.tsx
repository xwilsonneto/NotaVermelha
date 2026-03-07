import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  variant = 'primary',
  className = '',
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-lg items-center";
  const variantStyle = variant === 'primary' 
    ? "bg-primary-600" 
    : "bg-surface border border-primary-600";
  
  return (
    <TouchableOpacity 
      className={`${baseStyle} ${variantStyle} ${className}`}
      {...props}
    >
      <Text className="text-white font-bold text-lg">
        {title}
      </Text>
    </TouchableOpacity>
  );
};