import { createServerSupabaseClient } from '@/utils/supabase/server'
import { createPortalSession } from '@/utils/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()

  // Vérifier l'authentification
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    // Récupérer l'ID client Stripe de l'utilisateur
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single()

    if (error || !subscription || !subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Aucun abonnement trouvé' },
        { status: 404 }
      )
    }

    // Créer une session de portail client Stripe
    const portalUrl = await createPortalSession(subscription.stripe_customer_id)

    return NextResponse.json({ url: portalUrl })
  } catch (error: any) {
    console.error('Erreur lors de la création de la session de portail:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de portail' },
      { status: 500 }
    )
  }
}
