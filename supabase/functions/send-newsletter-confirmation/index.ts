
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("re_9uj8PQTj_4gKGEzinKNES125ZijeNDLZh"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewsletterSubscriptionRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: NewsletterSubscriptionRequest = await req.json();

    console.log("Processing newsletter subscription for:", email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if email already exists
    const { data: existingSubscription, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingSubscription) {
      return new Response(
        JSON.stringify({ message: "Email déjà inscrit à la newsletter" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Insert new subscription
    const { data: newSubscription, error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert([{ email }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log("Newsletter subscription created:", newSubscription);

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: "Club Créole <onboarding@resend.dev>",
      to: [email],
      subject: "Bienvenue au Club Créole ! 🌴",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b6b, #ffa726); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🌴 Bienvenue au Club Créole !</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2c5282; margin-top: 0;">Merci pour votre inscription !</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              Nous sommes ravis de vous compter parmi nous ! Vous serez désormais informé(e) en avant-première de l'ouverture du Club Créole.
            </p>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              Préparez-vous à découvrir :
            </p>
            
            <ul style="color: #4a5568; font-size: 16px; line-height: 1.8;">
              <li>🍽️ Une cuisine créole authentique</li>
              <li>🎵 Des soirées musicales inoubliables</li>
              <li>🌺 Une ambiance tropicale unique</li>
              <li>🎉 Des événements exclusifs</li>
            </ul>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
              Restez connecté(e), l'aventure créole commence bientôt !
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #718096; font-size: 14px;">
                À très bientôt au Club Créole ! 🌴
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #a0aec0; font-size: 12px;">
            <p>Club Créole - L'authenticité créole à votre portée</p>
          </div>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        message: "Inscription réussie ! Vérifiez votre email pour la confirmation.",
        subscription: newSubscription 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-newsletter-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
