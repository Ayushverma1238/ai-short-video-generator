"use client"
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import EmptyState from './_components/EmptyState'
import Link from 'next/link'

const DashboardPage = () => {
  const [videoList, setVideoList] = useState<string[]>([])
  return (
    <div className='p-10 bg-gray-800  min-h-[calc(100vh-50px)]'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-zinc-100'>Dashboard</h2>
        <Link href='/dashboard/create-new'>
        <Button className='px-3 py-2 ring ring-gray-100 bg-gray-900'>+ Create New</Button>
        </Link>
      </div>
      {videoList.length === 0 && (
        <EmptyState />
      )}
    </div>
  )
}

export default DashboardPage