
import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../types';
import { Sun, Moon, ChevronDown } from './icons';

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const THEMES: { name: Theme; label: string; icon: React.FC<any> }[] = [
  { name: 'twilight', label: 'Twilight', icon: Moon },
  { name: 'solaris', label: 'Solaris', icon: Sun },
  { name: 'midnight-dusk', label: 'Midnight Dusk', icon: Moon },
];

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const currentThemeData = THEMES.find((t) => t.name === currentTheme) || THEMES[0];
  const CurrentIcon = currentThemeData.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (theme: Theme) => {
    onThemeChange(theme);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <CurrentIcon className="w-4 h-4" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{currentThemeData.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md shadow-lg z-10 overflow-hidden" role="menu">
          {THEMES.map(({ name, label, icon: Icon }) => (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
              role="menuitem"
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
