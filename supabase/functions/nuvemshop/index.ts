import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NuvemShopStore {
  id: number;
  name: { pt: string; en?: string; es?: string };
  description?: { pt: string };
  email?: string;
  logo?: { src: string };
  main_currency: string;
}

interface NuvemShopOrder {
  id: number;
  number: string;
  customer: {
    id: number;
    name: string;
    email: string;
    identification?: string;
  };
  products: Array<{
    id: number;
    product_id: number;
    name: string;
    price: string;
    quantity: number;
    image?: { src: string };
    variant_id?: number;
    sku?: string;
  }>;
  total: string;
  created_at: string;
  status: string;
  payment_status: string;
  shipping_status: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, apiKey, apiUrl, storeSlug, orderNumber, customerEmail } = await req.json();

    console.log(`[NuvemShop] Action: ${action}`);

    switch (action) {
      case 'validate': {
        // Validate API credentials by fetching store info
        console.log(`[NuvemShop] Validating credentials for URL: ${apiUrl}`);
        
        const response = await fetch(`${apiUrl}/store`, {
          headers: {
            'Authentication': `bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Trocas.app (support@trocas.app)',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[NuvemShop] Validation failed: ${response.status} - ${errorText}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Credenciais inválidas: ${response.status}` 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const storeData: NuvemShopStore = await response.json();
        console.log(`[NuvemShop] Store validated: ${storeData.name?.pt || storeData.id}`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            store: {
              id: storeData.id,
              name: storeData.name?.pt || `Store ${storeData.id}`,
              email: storeData.email,
              currency: storeData.main_currency,
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-order': {
        // Fetch order by number for customer portal
        console.log(`[NuvemShop] Fetching order ${orderNumber} for store ${storeSlug}`);

        // Get store credentials from database
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('api_key, api_url, id')
          .eq('slug', storeSlug)
          .maybeSingle();

        if (storeError || !store) {
          console.error(`[NuvemShop] Store not found: ${storeSlug}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Loja não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get store settings
        const { data: settings } = await supabase
          .from('store_settings')
          .select('*')
          .eq('store_id', store.id)
          .maybeSingle();

        // Search for order by number
        const ordersResponse = await fetch(
          `${store.api_url}/orders?q=${orderNumber}`,
          {
            headers: {
              'Authentication': `bearer ${store.api_key}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Trocas.app (support@trocas.app)',
            },
          }
        );

        if (!ordersResponse.ok) {
          console.error(`[NuvemShop] Failed to fetch orders: ${ordersResponse.status}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao buscar pedido' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const orders: NuvemShopOrder[] = await ordersResponse.json();
        
        console.log(`[NuvemShop] Found ${orders.length} orders from API`);
        if (orders.length > 0) {
          console.log(`[NuvemShop] First order - number: "${orders[0].number}" (type: ${typeof orders[0].number}), email: "${orders[0].customer.email}"`);
          console.log(`[NuvemShop] Looking for - number: "${orderNumber}" (type: ${typeof orderNumber}), email: "${customerEmail}"`);
        }
        
        // Find matching order - compare as strings since order numbers can be numeric or string
        const order = orders.find(
          o => String(o.number) === String(orderNumber) && 
               o.customer.email.toLowerCase() === customerEmail.toLowerCase()
        );

        if (!order) {
          // Log all orders for debugging
          console.log(`[NuvemShop] Order not found. Available orders: ${orders.map(o => `#${o.number} (${o.customer.email})`).join(', ')}`);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Pedido não encontrado. Verifique o número do pedido e e-mail.' 
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check eligibility based on settings
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        const returnWindowDays = settings?.return_window_days || 7;
        const isEligible = daysSinceOrder <= returnWindowDays;

        console.log(`[NuvemShop] Order ${order.number} found, eligible: ${isEligible} (${daysSinceOrder}/${returnWindowDays} days)`);

        return new Response(
          JSON.stringify({
            success: true,
            order: {
              id: order.id,
              number: order.number,
              customer: {
                name: order.customer.name,
                email: order.customer.email,
              },
              items: order.products.map(p => ({
                id: p.id,
                productId: p.product_id,
                name: p.name,
                price: parseFloat(p.price),
                quantity: p.quantity,
                image: p.image?.src,
                sku: p.sku,
              })),
              total: parseFloat(order.total),
              createdAt: order.created_at,
              status: order.status,
            },
            eligibility: {
              isEligible,
              daysSinceOrder,
              returnWindowDays,
              message: isEligible 
                ? `Pedido elegível para troca/devolução` 
                : `Prazo de ${returnWindowDays} dias expirado (${daysSinceOrder} dias desde a compra)`,
            },
            settings: {
              allowRefund: settings?.allow_refund ?? true,
              allowStoreCredit: settings?.allow_store_credit ?? true,
              storeCreditBonus: settings?.store_credit_bonus ?? 5,
              requiresReason: settings?.requires_reason ?? true,
              allowPartialReturns: settings?.allow_partial_returns ?? true,
            },
            storeId: store.id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-orders': {
        // List recent orders for a store (for dashboard)
        console.log(`[NuvemShop] Listing orders with apiUrl: ${apiUrl}`);

        const response = await fetch(
          `${apiUrl}/orders?per_page=50&status=any`,
          {
            headers: {
              'Authentication': `bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Trocas.app (support@trocas.app)',
            },
          }
        );

        if (!response.ok) {
          console.error(`[NuvemShop] Failed to list orders: ${response.status}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao listar pedidos' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const orders: NuvemShopOrder[] = await response.json();
        console.log(`[NuvemShop] Found ${orders.length} orders`);

        return new Response(
          JSON.stringify({
            success: true,
            orders: orders.map(o => ({
              id: o.id,
              number: o.number,
              customerName: o.customer.name,
              customerEmail: o.customer.email,
              total: parseFloat(o.total),
              createdAt: o.created_at,
              status: o.status,
            })),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[NuvemShop] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
