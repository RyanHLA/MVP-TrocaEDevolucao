import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resend = {
  emails: {
    send: async (options: { from: string; to: string[]; subject: string; html: string }) => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }
      return response.json();
    },
  },
};



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  status: "approved" | "rejected" | "completed";
  storeName: string;
}

const getEmailContent = (data: NotificationRequest) => {
  const { customerName, orderNumber, status, storeName } = data;

  if (status === "approved") {
    return {
      subject: `Sua solicitação de troca/devolução foi aprovada - Pedido #${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Solicitação Aprovada ✓</h1>
          <p>Olá <strong>${customerName}</strong>,</p>
          <p>Sua solicitação de troca/devolução para o pedido <strong>#${orderNumber}</strong> foi <strong style="color: #22c55e;">aprovada</strong>.</p>
          <p>Próximos passos:</p>
          <ol>
            <li>Embale o(s) produto(s) de forma segura</li>
            <li>Aguarde o contato da loja com instruções de envio</li>
            <li>Envie o(s) produto(s) conforme orientação</li>
          </ol>
          <p>Em caso de dúvidas, entre em contato com a loja.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Este email foi enviado por ${storeName}</p>
        </div>
      `,
    };
  }

  if (status === "rejected") {
    return {
      subject: `Atualização sobre sua solicitação - Pedido #${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">Solicitação Não Aprovada</h1>
          <p>Olá <strong>${customerName}</strong>,</p>
          <p>Infelizmente, sua solicitação de troca/devolução para o pedido <strong>#${orderNumber}</strong> não pôde ser aprovada no momento.</p>
          <p>Isso pode ter ocorrido por diversos motivos, como:</p>
          <ul>
            <li>Prazo de devolução excedido</li>
            <li>Produto não elegível para troca/devolução</li>
            <li>Informações incompletas</li>
          </ul>
          <p>Para mais informações, entre em contato diretamente com a loja.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Este email foi enviado por ${storeName}</p>
        </div>
      `,
    };
  }

  // completed
  return {
    subject: `Troca/devolução concluída - Pedido #${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Processo Concluído ✓</h1>
        <p>Olá <strong>${customerName}</strong>,</p>
        <p>O processo de troca/devolução do pedido <strong>#${orderNumber}</strong> foi <strong style="color: #3b82f6;">concluído com sucesso</strong>.</p>
        <p>Caso tenha optado por:</p>
        <ul>
          <li><strong>Reembolso:</strong> O valor será creditado em até 10 dias úteis</li>
          <li><strong>Crédito na loja:</strong> Já está disponível para uso</li>
        </ul>
        <p>Agradecemos pela preferência!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Este email foi enviado por ${storeName}</p>
      </div>
    `,
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    console.log("Sending notification email:", data);

    const { subject, html } = getEmailContent(data);

    const emailResponse = await resend.emails.send({
      from: "Notificações <onboarding@resend.dev>",
      to: [data.customerEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
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
