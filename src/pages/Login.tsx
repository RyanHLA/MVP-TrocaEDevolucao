import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, isLoading: authLoading } = useAuth();
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
    
    const { error } = await signIn(email, password);
    
    setIsLoading(false);
    
    if (error) {
      let message = "Erro ao fazer login";
      if (error.message.includes("Invalid login credentials")) {
        message = "E-mail ou senha incorretos";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Por favor, confirme seu e-mail antes de fazer login";
      }
      toast({
        title: "Erro no login",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login realizado!",
      description: "Redirecionando para o dashboard...",
    });
    navigate('/dashboard');
  };

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
        <title>Login - Trocas.app</title>
        <meta name="description" content="Acesse sua conta no Trocas.app para gerenciar trocas e devoluções." />
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

            <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta</h1>
            <p className="text-muted-foreground mb-8">
              Entre na sua conta para acessar o dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <p className="text-center text-muted-foreground mt-6">
              Não tem uma conta?{" "}
              <button 
                onClick={() => navigate('/signup')}
                className="text-primary hover:underline"
              >
                Criar conta
              </button>
            </p>
          </div>
        </div>

        {/* Right side - Decorative */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-secondary to-muted p-8">
          <div className="max-w-md text-center">
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
              <RefreshCw className="w-12 h-12 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              Gerencie trocas e devoluções com facilidade
            </h2>
            <p className="text-muted-foreground">
              Dashboard completo para acompanhar métricas, configurar regras e 
              converter reembolsos em créditos na loja.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
