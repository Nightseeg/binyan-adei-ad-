import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`Received ${req.method} request to notify-registration`)

  try {
    const payload = await req.json()
    console.log('Payload received:', JSON.stringify(payload))
    
    const { firstName, lastName, gender, city, email, phone } = payload

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('CRITICAL: RESEND_API_KEY is not set in Supabase secrets!')
      throw new Error('RESEND_API_KEY is not set')
    }

    const ADMIN_EMAIL = 'binadeiad@gmail.com'
    console.log(`Attempting to send email to ${ADMIN_EMAIL} via Resend...`)

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Binian Adei Ad <contact@binianadeiad.com>',
        to: ADMIN_EMAIL,
        subject: `🆕 Nouvelle inscription - ${firstName} ${lastName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a2f4c;">
            <h2 style="color: #c5a365; border-bottom: 2px solid #c5a365; padding-bottom: 10px;">Nouvelle Inscription sur Binian Adei Ad</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; font-weight: bold; border: 1px solid #eee;">Nom</td>
                <td style="padding: 12px; border: 1px solid #eee;">${lastName || 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; border: 1px solid #eee;">Prénom</td>
                <td style="padding: 12px; border: 1px solid #eee;">${firstName || 'Non renseigné'}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; font-weight: bold; border: 1px solid #eee;">Genre</td>
                <td style="padding: 12px; border: 1px solid #eee;">${gender === 'MALE' ? 'Homme' : 'Femme'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; border: 1px solid #eee;">Ville</td>
                <td style="padding: 12px; border: 1px solid #eee;">${city || 'Non renseignée'}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; font-weight: bold; border: 1px solid #eee;">Email</td>
                <td style="padding: 12px; border: 1px solid #eee;">${email || 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold; border: 1px solid #eee;">Téléphone</td>
                <td style="padding: 12px; border: 1px solid #eee;">${phone || 'Non renseigné'}</td>
              </tr>
            </table>
            <p style="margin-top: 24px; color: #888; font-size: 12px;">Connectez-vous au dashboard Shadchan pour voir le profil complet.</p>
          </div>
        `
      })
    })

    const responseData = await emailResponse.text()

    if (!emailResponse.ok) {
      console.error('Resend API Error:', responseData)
      throw new Error(`Resend API failed: ${responseData}`)
    }

    console.log('Email sent successfully:', responseData)

    return new Response(
      JSON.stringify({ message: 'Notification envoyée', resendId: responseData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Edge Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
