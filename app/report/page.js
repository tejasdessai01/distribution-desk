import { Suspense } from 'react'
import ReportClient from './ReportClient'

// Avoid static prerender issues with search params
export const dynamic = 'force-dynamic'

export default function ReportPage(){
  return (
    <Suspense>
      <ReportClient />
    </Suspense>
  )
}
