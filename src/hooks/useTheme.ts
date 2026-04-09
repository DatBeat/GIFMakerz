import { useEffect } from 'react';
import { useGifStore } from '../stores/gifStore';

export function useTheme() {
  const theme = useGifStore((s) => s.theme);
  const setTheme = useGifStore((s) => s.setTheme);

  useEffect(() => {
    function apply() {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    }

    apply();

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);

  const effectiveTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;

  return { theme, effectiveTheme, setTheme };
}
