import { createServerSupabaseClient } from '@/utils/supabase/server'
import { encrypt, decrypt } from '@/utils/encryption'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schéma de validation pour la création/mise à jour d'une clé API
const apiKeySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  provider_id: z.number().int().positive('Fournisseur invalide'),
  api_key: z.string().min(1, 'La clé API est requise'),
  model: z.string().optional(),
})

export async function GET() {
  const supabase = createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('api_configurations')
    .select(`
      id,
      name,
      is_valid,
      last_validated_at,
      created_at,
      api_providers (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = apiKeySchema.parse(body)

    // Vérifier le quota de configurations pour les utilisateurs gratuits
    const { data: subscriptionData } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', session.user.id)
      .single()

    const isPremium = subscriptionData?.status === 'active'

    if (!isPremium) {
      const { count, error: countError } = await supabase
        .from('api_configurations')
        .select('id', { count: 'exact' })
        .eq('user_id', session.user.id)

      if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 })
      }

      if (count && count >= 1) {
        return NextResponse.json(
          { error: 'Les utilisateurs gratuits sont limités à 1 configuration API. Passez au plan premium pour en ajouter davantage.' },
          { status: 403 }
        )
      }
    }

    // Chiffrer la clé API avant de la stocker
    const encryptedApiKey = encrypt(validatedData.api_key)

    const { data, error } = await supabase
      .from('api_configurations')
      .insert({
        user_id: session.user.id,
        name: validatedData.name,
        provider_id: validatedData.provider_id,
        api_key: encryptedApiKey,
        model: validatedData.model || null,
        is_valid: true,
        last_validated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
