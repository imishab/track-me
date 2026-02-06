import React from 'react'
import { Spinner } from './ui/spinner'

export default function loader() {
  return (
    <div className="flex items-center justify-center h-[calc(70vh-10rem)]">
        <Spinner className="size-4" /> <p className="text-muted-foreground text-xs ml-2">Loading Please Wait...</p>
    </div>
  )
}
