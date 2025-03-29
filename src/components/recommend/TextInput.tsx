'use client';

import { useState, useEffect, useRef } from 'react';

interface TextInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

const TextInput = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  maxLength = 500
}: TextInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(0);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCharCount(newValue.length);
    onChange(e);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        className="w-full px-3 py-2 bg-gray-700 rounded-md min-h-[100px] resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
        rows={4}
      />
      <div className="absolute bottom-2 right-2 text-sm text-gray-400">
        {charCount}/{maxLength}
      </div>
    </div>
  );
};

export default TextInput; 