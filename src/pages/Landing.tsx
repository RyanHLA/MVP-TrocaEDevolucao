import { LandingNav } from "@/components/LandingNav";
import { LandingHero } from "@/components/LandingHero";
import { Helmet } from "react-helmet-async";

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Trocas.app - Transforme Devoluções em Receita</title>
        <meta name="description" content="Plataforma SaaS para gerenciar trocas e devoluções de e-commerce. Converta reembolsos em créditos na loja e mantenha sua receita." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <LandingNav />
        <LandingHero />
      </div>
    </>
  );
}
