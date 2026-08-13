'use client'
import { forwardRef } from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/cn'

const Tabs = TabsPrimitive.Root

const TabsList = forwardRef(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn('flex items-center gap-4 border-b', className)}
      {...props}
    />
  )
})

const TabsTrigger = forwardRef(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        '-mb-px inline-flex h-9 items-center gap-1.5 border-b-2 border-transparent text-body-md text-secondary transition-colors duration-fast ease-out hover:text-primary data-[state=active]:border-strong data-[state=active]:text-primary disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      {...props}
    />
  )
})

const TabsContent = forwardRef(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn('pt-4 focus:outline-none', className)}
      {...props}
    />
  )
})

export { Tabs, TabsList, TabsTrigger, TabsContent }
