import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MELHOR_ENVIO_API_URL = 'https://melhorenvio.com.br/api/v2';
const MELHOR_ENVIO_SANDBOX_URL = 'https://sandbox.melhorenvio.com.br/api/v2';

interface ShippingRequest {
  action: 'calculate' | 'create-label' | 'checkout' | 'print' | 'tracking';
  returnRequestId?: string;
  storeId?: string;
  serviceId?: number;
  useSandbox?: boolean;
}

interface StoreData {
  name: string;
  document: string | null;
  phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_district: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
}

interface ReturnRequestData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_postal_code: string | null;
  customer_address: string | null;
  customer_address_number: string | null;
  customer_district: string | null;
  customer_city: string | null;
  customer_state: string | null;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total_value: number;
  shipping_id: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const melhorEnvioToken = Deno.env.get('MELHOR_ENVIO_TOKEN');
    
    if (!melhorEnvioToken) {
      console.error('[MelhorEnvio] Token not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Token do Melhor Envio não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, returnRequestId, storeId, serviceId, useSandbox = false }: ShippingRequest = await req.json();
    
    const apiUrl = useSandbox ? MELHOR_ENVIO_SANDBOX_URL : MELHOR_ENVIO_API_URL;

    console.log(`[MelhorEnvio] Action: ${action}, Request ID: ${returnRequestId}`);

    switch (action) {
      case 'calculate': {
        // Calculate shipping quote for a return request
        if (!returnRequestId) {
          return new Response(
            JSON.stringify({ success: false, error: 'returnRequestId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get return request and store data
        const { data: request, error: requestError } = await supabase
          .from('return_requests')
          .select('*, stores(*)')
          .eq('id', returnRequestId)
          .single();

        if (requestError || !request) {
          console.error('[MelhorEnvio] Return request not found:', requestError);
          return new Response(
            JSON.stringify({ success: false, error: 'Solicitação não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const store = request.stores as StoreData;
        
        // Validate store address
        if (!store.address_postal_code || !store.address_city) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Endereço da loja não configurado. Configure em Configurações.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate customer address
        if (!request.customer_postal_code) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'CEP do cliente não informado na solicitação.' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Calculate total weight (estimate 0.5kg per item)
        const items = request.items as Array<{ quantity: number }>;
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const estimatedWeight = Math.max(0.3, totalItems * 0.5);

        // Melhor Envio quote request
        const quotePayload = {
          from: { postal_code: store.address_postal_code.replace(/\D/g, '') },
          to: { postal_code: request.customer_postal_code.replace(/\D/g, '') },
          products: [{
            id: returnRequestId,
            width: 20,
            height: 15,
            length: 30,
            weight: estimatedWeight,
            insurance_value: Number(request.total_value),
            quantity: 1,
          }],
        };

        console.log('[MelhorEnvio] Quote payload:', JSON.stringify(quotePayload));

        const quoteResponse = await fetch(`${apiUrl}/me/shipment/calculate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${melhorEnvioToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Trocas.app (support@trocas.app)',
          },
          body: JSON.stringify(quotePayload),
        });

        if (!quoteResponse.ok) {
          const errorText = await quoteResponse.text();
          console.error('[MelhorEnvio] Quote failed:', quoteResponse.status, errorText);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao calcular frete: ${quoteResponse.status}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const quotes = await quoteResponse.json();
        console.log('[MelhorEnvio] Quote response:', JSON.stringify(quotes));

        // Filter only available services
        const availableQuotes = quotes.filter((q: { error?: string }) => !q.error);

        return new Response(
          JSON.stringify({ success: true, quotes: availableQuotes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create-label': {
        // Create shipping label (add to Melhor Envio cart)
        if (!returnRequestId || !serviceId) {
          return new Response(
            JSON.stringify({ success: false, error: 'returnRequestId e serviceId são obrigatórios' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get return request and store data
        const { data: request, error: requestError } = await supabase
          .from('return_requests')
          .select('*, stores(*)')
          .eq('id', returnRequestId)
          .single();

        if (requestError || !request) {
          console.error('[MelhorEnvio] Return request not found:', requestError);
          return new Response(
            JSON.stringify({ success: false, error: 'Solicitação não encontrada' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const store = request.stores as StoreData;
        const items = request.items as Array<{ name: string; quantity: number; price: number }>;
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const estimatedWeight = Math.max(0.3, totalItems * 0.5);

        // For reverse logistics: customer sends TO store
        const cartPayload = {
          service: serviceId,
          from: {
            name: request.customer_name,
            phone: request.customer_phone?.replace(/\D/g, '') || '11999999999',
            email: request.customer_email,
            document: '', // CPF will be empty, non-commercial
            address: request.customer_address || 'Endereço não informado',
            complement: '',
            number: request.customer_address_number || 'S/N',
            district: request.customer_district || 'Centro',
            city: request.customer_city || 'São Paulo',
            state_abbr: request.customer_state || 'SP',
            postal_code: request.customer_postal_code?.replace(/\D/g, '') || '',
          },
          to: {
            name: store.name,
            phone: store.phone?.replace(/\D/g, '') || '11999999999',
            email: 'contato@loja.com',
            company_document: store.document?.replace(/\D/g, '') || '',
            address: store.address_street || '',
            complement: store.address_complement || '',
            number: store.address_number || '',
            district: store.address_district || '',
            city: store.address_city || '',
            state_abbr: store.address_state || '',
            postal_code: store.address_postal_code?.replace(/\D/g, '') || '',
          },
          products: items.map((item, index) => ({
            name: item.name,
            quantity: String(item.quantity),
            unitary_value: String(item.price),
          })),
          volumes: [{
            height: 15,
            width: 20,
            length: 30,
            weight: estimatedWeight,
          }],
          options: {
            insurance_value: Number(request.total_value),
            receipt: false,
            own_hand: false,
            reverse: true, // REVERSE LOGISTICS
            non_commercial: true, // No invoice needed for returns
            platform: 'Trocas.app',
            tags: [{
              tag: request.order_number,
              url: null,
            }],
          },
        };

        console.log('[MelhorEnvio] Cart payload:', JSON.stringify(cartPayload));

        const cartResponse = await fetch(`${apiUrl}/me/cart`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${melhorEnvioToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Trocas.app (support@trocas.app)',
          },
          body: JSON.stringify(cartPayload),
        });

        if (!cartResponse.ok) {
          const errorText = await cartResponse.text();
          console.error('[MelhorEnvio] Cart insert failed:', cartResponse.status, errorText);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao criar etiqueta: ${errorText}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const cartData = await cartResponse.json();
        console.log('[MelhorEnvio] Cart response:', JSON.stringify(cartData));

        const shippingId = cartData.id;

        // Update return request with shipping ID
        await supabase
          .from('return_requests')
          .update({ 
            shipping_id: shippingId,
            shipping_provider: 'melhor_envio',
          })
          .eq('id', returnRequestId);

        return new Response(
          JSON.stringify({ success: true, shippingId, data: cartData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'checkout': {
        // Purchase the shipping label
        if (!returnRequestId) {
          return new Response(
            JSON.stringify({ success: false, error: 'returnRequestId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: request, error: requestError } = await supabase
          .from('return_requests')
          .select('shipping_id')
          .eq('id', returnRequestId)
          .single();

        if (requestError || !request?.shipping_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Etiqueta não criada. Crie primeiro.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Checkout (purchase) the label
        const checkoutResponse = await fetch(`${apiUrl}/me/shipment/checkout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${melhorEnvioToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Trocas.app (support@trocas.app)',
          },
          body: JSON.stringify({ orders: [request.shipping_id] }),
        });

        if (!checkoutResponse.ok) {
          const errorText = await checkoutResponse.text();
          console.error('[MelhorEnvio] Checkout failed:', checkoutResponse.status, errorText);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao comprar etiqueta: ${errorText}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const checkoutData = await checkoutResponse.json();
        console.log('[MelhorEnvio] Checkout response:', JSON.stringify(checkoutData));

        // Generate the label
        const generateResponse = await fetch(`${apiUrl}/me/shipment/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${melhorEnvioToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Trocas.app (support@trocas.app)',
          },
          body: JSON.stringify({ orders: [request.shipping_id] }),
        });

        if (!generateResponse.ok) {
          const errorText = await generateResponse.text();
          console.error('[MelhorEnvio] Generate failed:', generateResponse.status, errorText);
          return new Response(
            JSON.stringify({ success: false, error: `Erro ao gerar etiqueta: ${errorText}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const generateData = await generateResponse.json();
        console.log('[MelhorEnvio] Generate response:', JSON.stringify(generateData));

        // Get the print URL
        const printResponse = await fetch(`${apiUrl}/me/shipment/print`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${melhorEnvioToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Trocas.app (support@trocas.app)',
          },
          body: JSON.stringify({ 
            mode: 'public',
            orders: [request.shipping_id] 
          }),
        });

        let labelUrl = null;
        if (printResponse.ok) {
          const printData = await printResponse.json();
          labelUrl = printData.url;
          console.log('[MelhorEnvio] Print URL:', labelUrl);
        }

        // Get tracking info
        const trackingResponse = await fetch(`${apiUrl}/me/shipment/tracking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${melhorEnvioToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Trocas.app (support@trocas.app)',
          },
          body: JSON.stringify({ orders: [request.shipping_id] }),
        });

        let trackingCode = null;
        let shippingCost = 0;
        if (trackingResponse.ok) {
          const trackingData = await trackingResponse.json();
          const shipmentInfo = trackingData[request.shipping_id];
          if (shipmentInfo) {
            trackingCode = shipmentInfo.tracking;
            shippingCost = parseFloat(shipmentInfo.price) || 0;
          }
          console.log('[MelhorEnvio] Tracking:', trackingCode);
        }

        // Update return request with label info
        await supabase
          .from('return_requests')
          .update({ 
            label_url: labelUrl,
            tracking_code: trackingCode,
            shipping_cost: shippingCost,
          })
          .eq('id', returnRequestId);

        return new Response(
          JSON.stringify({ 
            success: true, 
            labelUrl, 
            trackingCode,
            shippingCost,
            checkoutData 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'tracking': {
        // Get tracking info for a shipment
        if (!returnRequestId) {
          return new Response(
            JSON.stringify({ success: false, error: 'returnRequestId é obrigatório' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: request, error: requestError } = await supabase
          .from('return_requests')
          .select('shipping_id, tracking_code, label_url')
          .eq('id', returnRequestId)
          .single();

        if (requestError || !request?.shipping_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Etiqueta não encontrada' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const trackingResponse = await fetch(`${apiUrl}/me/shipment/tracking`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${melhorEnvioToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Trocas.app (support@trocas.app)',
          },
          body: JSON.stringify({ orders: [request.shipping_id] }),
        });

        if (!trackingResponse.ok) {
          const errorText = await trackingResponse.text();
          console.error('[MelhorEnvio] Tracking failed:', trackingResponse.status, errorText);
          return new Response(
            JSON.stringify({ success: false, error: 'Erro ao buscar rastreio' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const trackingData = await trackingResponse.json();
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            tracking: trackingData[request.shipping_id],
            trackingCode: request.tracking_code,
            labelUrl: request.label_url,
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
    console.error('[MelhorEnvio] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});