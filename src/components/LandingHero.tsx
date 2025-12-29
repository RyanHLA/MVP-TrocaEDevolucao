import { Button } from "@/components/ui/button";
import { ArrowRight, RefreshCw, CreditCard, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16">
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-sm font-medium text-primary">Integrado com Nuvem Shop</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-foreground">
            Transforme devoluções
            <br />
            em <span className="text-primary">receita retida</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Converta reembolsos em créditos na loja com bônus atrativo. 
            Simplifique operações de troca e devolução enquanto mantém seu faturamento.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button 
              size="xl" 
              onClick={() => navigate('/signup')}
              className="gap-2"
            >
              Começar gratuitamente
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => navigate('/portal/demo')}
            >
              Ver portal do cliente
            </Button>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <FeatureCard
              icon={<RefreshCw className="w-5 h-5" />}
              title="Trocas Simplificadas"
              description="Portal white-label para seus clientes"
            />
            <FeatureCard
              icon={<CreditCard className="w-5 h-5" />}
              title="Crédito com Bônus"
              description="Incentive crédito na loja"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Analytics Completo"
              description="Métricas de conversão e receita"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 text-left">
      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
