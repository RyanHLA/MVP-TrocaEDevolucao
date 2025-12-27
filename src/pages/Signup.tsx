import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, ArrowLeft, Eye, EyeOff, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(email, password, name);
    
    setIsLoading(false);
    
    if (error) {
      let message = "Erro ao criar conta";
      if (error.message.includes("User already registered")) {
        message = "Este e-mail já está cadastrado";
      } else if (error.message.includes("Password")) {
        message = "A senha deve ter pelo menos 6 caracteres";
      }
      toast({
        title: "Erro no cadastro",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada com sucesso!",
      description: "Redirecionando para o dashboard...",
    });
    navigate('/dashboard');
  };

  const benefits = [
    "Portal white-label para seus clientes",
    "Bônus configurável para créditos",
    "Dashboard com métricas completas",
    "Integração com Nuvem Shop",
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Criar Conta - Trocas.app</title>
        <meta name="description" content="Crie sua conta no Trocas.app e comece a gerenciar trocas e devoluções do seu e-commerce." />
      </Helmet>
      <div className="min-h-screen bg-background flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md animate-fade-in">
            <Button 
              variant="ghost" 
              className="mb-8"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Trocas.app</span>
            </div>

            <h1 className="text-3xl font-bold mb-2">Crie sua conta</h1>
            <p className="text-muted-foreground mb-8">
              Comece a gerenciar trocas e devoluções hoje
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 bg-secondary/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                className="w-full h-12"
                disabled={isLoading}
              >
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              Já tem uma conta?{" "}
              <button 
                onClick={() => navigate('/login')}
                className="text-primary hover:underline"
              >
                Entrar
              </button>
            </p>
          </div>
        </div>

        {/* Right side - Benefits */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-secondary to-muted p-8">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-8">
              Tudo que você precisa para gerenciar devoluções
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50 animate-slide-in-right`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
