import React from "react"
import GuideEditorForm from "@/components/GuideEditorForm"

export const dynamic = "force-dynamic"

interface EditGuidePageProps {
  params: {
    id: string
  }
}

export default function EditGuidePage({ params }: EditGuidePageProps) {
  return <GuideEditorForm guideId={params.id} />
}
