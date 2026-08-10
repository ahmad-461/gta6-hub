import React from "react"
import ArticleEditorForm from "@/components/ArticleEditorForm"

export const dynamic = "force-dynamic"

interface EditArticlePageProps {
  params: {
    id: string
  }
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  return <ArticleEditorForm articleId={params.id} />
}
