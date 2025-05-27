
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const NotifyForm = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    console.log("Tentative d'enregistrement de l'email:", email);

    try {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{ email: email }])
        .select();

      if (error) {
        console.error("Erreur lors de l'enregistrement:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'inscription.",
          variant: "destructive",
        });
      } else {
        console.log("Email enregistré avec succès:", data);
        setIsSubmitted(true);
        toast({
          title: "Inscription réussie !",
          description: "Vous serez notifié dès l'ouverture du Club Créole.",
        });
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-creole-sunset to-creole-coral">
      <div className="container mx-auto px-6">
        <Card className="max-w-2xl mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-4xl font-bold text-creole-ocean mb-4">
              Restez informé
            </CardTitle>
            <p className="text-lg text-gray-600">
              Soyez le premier à découvrir le Club Créole lors de son ouverture
            </p>
          </CardHeader>
          <CardContent className="p-8">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="email"
                    placeholder="Votre adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="pl-12 py-4 text-lg border-2 border-gray-200 focus:border-creole-ocean rounded-xl"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-creole-ocean hover:bg-creole-ocean/90 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? "Inscription en cours..." : "Je veux être notifié"}
                </Button>
                <p className="text-sm text-gray-500 text-center">
                  Nous respectons votre vie privée. Aucun spam, promis !
                </p>
              </form>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-creole-ocean mb-4">
                  Merci pour votre inscription !
                </h3>
                <p className="text-gray-600 text-lg">
                  Vous recevrez un email dès que nous ouvrirons nos portes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default NotifyForm;
