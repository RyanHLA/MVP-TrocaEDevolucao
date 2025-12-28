import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NUVEMSHOP_CLIENT_ID = Deno.env.get('NUVEMSHOP_CLIENT_ID')!;
const NUVEMSHOP_CLIENT_SECRET = Deno.env.get('NUVEMSHOP_CLIENT_SECRET')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle POST request to generate install URL
    if (req.method === 'POST') {
      const { action, userId, storeName } = await req.json();

      if (action === 'get-install-url') {
        // Generate the installation URL for NuvemShop
        // State contains user ID and store name for after OAuth completes
        const state = btoa(JSON.stringify({ userId, storeName }));
        
        // Use the app installation URL
        // Users will go to: https://www.tiendanube.com/apps/{app_id}/authorize
        // Or for Brazil: https://www.nuvemshop.com.br/apps/{app_id}/authorize
        const installUrl = `https://www.tiendanube.com/apps/${NUVEMSHOP_CLIENT_ID}/authorize?state=${encodeURIComponent(state)}`;
        
        console.log(`[NuvemShop OAuth] Generated install URL for user ${userId}`);
        
        return new Response(
          JSON.stringify({ success: true, installUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'exchange-token') {
        // Exchange authorization code for access token
        const { code, state } = await req.json();
        
        console.log(`[NuvemShop OAuth] Exchanging code for token`);
        
        // Decode state to get user info
        let stateData: { userId: string; storeName: string };
        try {
          stateData = JSON.parse(atob(state));
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: 'Estado inválido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://www.tiendanube.com/apps/authorize/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: NUVEMSHOP_CLIENT_ID,
            client_secret: NUVEMSHOP_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
          }),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error(`[NuvemShop OAuth] Token exchange failed: ${tokenResponse.status} - ${errorText}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Falha ao obter token de acesso' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tokenData = await tokenResponse.json();
        const { access_token, user_id: nuvemshopStoreId, scope } = tokenData;

        console.log(`[NuvemShop OAuth] Token obtained for store ${nuvemshopStoreId}`);

        // Fetch store info to get the name
        const storeResponse = await fetch(
          `https://api.tiendanube.com/v1/${nuvemshopStoreId}/store`,
          {
            headers: {
              'Authentication': `bearer ${access_token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Trocas.app (support@trocas.app)',
            },
          }
        );

        let storeInfo = { name: stateData.storeName };
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          storeInfo.name = storeData.name?.pt || storeData.name?.es || storeData.name?.en || stateData.storeName;
        }

        // Create slug from store name
        const slug = storeInfo.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        // API URL for this store
        const apiUrl = `https://api.tiendanube.com/v1/${nuvemshopStoreId}`;

        // Check if store already exists
        const { data: existingStore } = await supabase
          .from('stores')
          .select('id')
          .eq('nuvemshop_store_id', nuvemshopStoreId.toString())
          .eq('user_id', stateData.userId)
          .maybeSingle();

        if (existingStore) {
          // Update existing store with new token
          const { error: updateError } = await supabase
            .from('stores')
            .update({
              api_key: access_token,
              api_url: apiUrl,
              name: storeInfo.name,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingStore.id);

          if (updateError) {
            console.error(`[NuvemShop OAuth] Failed to update store: ${updateError.message}`);
            throw updateError;
          }

          console.log(`[NuvemShop OAuth] Updated existing store ${existingStore.id}`);
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              storeId: existingStore.id,
              storeName: storeInfo.name,
              updated: true,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create new store
        const { data: newStore, error: storeError } = await supabase
          .from('stores')
          .insert({
            user_id: stateData.userId,
            name: storeInfo.name,
            slug,
            api_key: access_token,
            api_url: apiUrl,
            nuvemshop_store_id: nuvemshopStoreId.toString(),
          })
          .select()
          .single();

        if (storeError) {
          console.error(`[NuvemShop OAuth] Failed to create store: ${storeError.message}`);
          throw storeError;
        }

        // Create default settings
        const { error: settingsError } = await supabase
          .from('store_settings')
          .insert({
            store_id: newStore.id,
            return_window_days: 7,
            allow_refund: true,
            allow_store_credit: true,
            store_credit_bonus: 5,
            credit_format: 'coupon',
            requires_reason: true,
            allow_partial_returns: true,
          });

        if (settingsError) {
          console.error(`[NuvemShop OAuth] Failed to create settings: ${settingsError.message}`);
        }

        console.log(`[NuvemShop OAuth] Created new store ${newStore.id}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            storeId: newStore.id,
            storeName: storeInfo.name,
            updated: false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Handle GET request (OAuth callback redirect)
    if (req.method === 'GET') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) {
        console.error('[NuvemShop OAuth] Missing code or state in callback');
        return new Response(
          `<html>
            <head><meta charset="utf-8"><title>Erro</title></head>
            <body>
              <h1>Erro na autenticação</h1>
              <p>Parâmetros inválidos. Por favor, tente novamente.</p>
              <script>
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      }

      // Return HTML that will communicate with the parent window
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Conectando loja...</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #0f172a;
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
              }
              .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255,255,255,0.3);
                border-top-color: #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h2>Conectando sua loja...</h2>
              <p>Por favor, aguarde.</p>
            </div>
            <script>
              const code = '${code}';
              const state = '${state}';
              
              // Send message to parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'nuvemshop-oauth-callback',
                  code,
                  state,
                }, '*');
              }
              
              // Close this window after a short delay
              setTimeout(() => {
                document.body.innerHTML = \`
                  <div class="container">
                    <h2>Loja conectada!</h2>
                    <p>Você pode fechar esta janela.</p>
                  </div>
                \`;
                setTimeout(() => window.close(), 2000);
              }, 1000);
            </script>
          </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[NuvemShop OAuth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
