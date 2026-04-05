import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

/**
 * Registry of article content components, keyed by article ID.
 * Each component is lazy-loaded to avoid bundling all articles upfront.
 */
export const ARTICLE_CONTENT: Record<string, LazyExoticComponent<ComponentType>> = {
  'nippon-steel-revenue': lazy(() => import('../components/articles/content/NipponSteelRevenue')),
}
