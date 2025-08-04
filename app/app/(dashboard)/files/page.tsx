import React from 'react'
import FileTable from '@/components/file-table'

const Files = () => {
  return (
    <div className="flex flex-col gap-4 flex-1 col-span-3 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 py-4 lg:py-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Files</h1>
            <p className="text-sm text-muted-foreground">
              Manage and organize your files across all connected cloud storage providers.
            </p>
          </div>
        </div>
      </div>
      <FileTable />
    </div>
  )
}

export default Files