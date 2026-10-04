import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

const EmptyState = () => {
  return (
    <div className='flex flex-col items-center justify-center gap-5 p-5 py-25 border-dashed border border-gray-400 rounded-md mt-10'>
      <h2 className='text-2xl font-semibold text-zinc-100'>You don't have any short videos created</h2>
      <Link href='/dashboard/create-new'>
        <Button className="px-4 py-3 ring-1 ring-zinc-500">Create New Short Video</Button>
      </Link>
    </div>
  )
}

export default EmptyState