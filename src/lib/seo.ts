import { useEffect } from 'react';

export function usePageMeta(meta: { title: string; description: string }): void {
  useEffect(() => {
    document.title = meta.title;

    const updateMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) {
          const prop = selector.match(/property="([^"]+)"/)?.[1];
          if (prop) el.setAttribute('property', prop);
        } else {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    updateMeta('meta[name="description"]', 'content', meta.description);
    updateMeta('meta[property="og:title"]', 'content', meta.title);
    updateMeta('meta[property="og:description"]', 'content', meta.description);
    updateMeta('meta[name="twitter:title"]', 'content', meta.title);
    updateMeta('meta[name="twitter:description"]', 'content', meta.description);
  }, [meta.title, meta.description]);
}
