import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (previous.current !== pathname) {
      document.getElementById('main-content')?.focus({ preventScroll: true });
      previous.current = pathname;
    }
  }, [pathname]);

  return null;
}
