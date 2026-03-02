import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { ActiveTab, CategoryContextValue } from '../types'

const CategoryContext = createContext<CategoryContextValue | null>(null)

export function CategoryProvider({ children }: { children: ReactNode }): JSX.Element {
  const [activeCategory, setActiveCategory] = useState<ActiveTab>('top')

  return (
    <CategoryContext.Provider value={{ activeCategory, setActiveCategory }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategoryContext(): CategoryContextValue {
  const ctx = useContext(CategoryContext)
  if (!ctx) {
    throw new Error('useCategoryContext must be used within a CategoryProvider')
  }
  return ctx
}
