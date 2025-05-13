import { createServerSupabaseClient } from '@/utils/supabase/server'
import { createCheckoutSession } from '@/utils/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()

  // Vérifier l'authentification
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    // Vérifier si l'utilisateur a déjà un abonnement actif
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status, stripe_customer_id')
      .eq('user_id', session.user.id)
      .single()

    if (subscription && subscription.status === 'active') {
      return NextResponse.json(
        { error: 'Vous avez déjà un abonnement actif' },
        { status: 400 }
      )
    }

    // Créer une session de paiement Stripe
    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      session.user.email
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error: any) {
    console.error('Erreur lors de la création de la session de paiement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
