import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

interface FieldStateProps {
  invalid?: boolean;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldStateProps;
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldStateProps;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldStateProps;

export const Input = ({ className, invalid, ...props }: InputProps) => {
  return <input className={cn('input-field', invalid && 'field-invalid', className)} {...props} />;
};

export const Select = ({ className, invalid, children, ...props }: SelectProps) => {
  return (
    <select className={cn('select-field', invalid && 'field-invalid', className)} {...props}>
      {children}
    </select>
  );
};

export const Textarea = ({ className, invalid, ...props }: TextareaProps) => {
  return <textarea className={cn('textarea-field', invalid && 'field-invalid', className)} {...props} />;
};
