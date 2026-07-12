import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

interface FieldStateProps {
  invalid?: boolean;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldStateProps;
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldStateProps;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldStateProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, invalid, ...props }, ref) => {
  return <input ref={ref} className={cn('input-field', invalid && 'field-invalid', className)} {...props} />;
});

Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, invalid, children, ...props }, ref) => {
  return (
    <select ref={ref} className={cn('select-field', invalid && 'field-invalid', className)} {...props}>
      {children}
    </select>
  );
});

Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, invalid, ...props }, ref) => {
  return <textarea ref={ref} className={cn('textarea-field', invalid && 'field-invalid', className)} {...props} />;
});

Textarea.displayName = 'Textarea';
