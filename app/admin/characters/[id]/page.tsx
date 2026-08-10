import React from "react"
import CharacterEditorForm from "@/components/CharacterEditorForm"

export const dynamic = "force-dynamic"

interface EditCharacterPageProps {
  params: {
    id: string
  }
}

export default function EditCharacterPage({ params }: EditCharacterPageProps) {
  return <CharacterEditorForm characterId={params.id} />
}
