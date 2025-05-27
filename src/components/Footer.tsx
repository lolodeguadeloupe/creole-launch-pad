
import { Heart, Globe } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-creole-ocean text-white py-12">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Globe className="w-8 h-8 mr-3 text-creole-coral" />
            <h3 className="text-3xl font-bold">
              Club<span className="text-creole-sand">Créole</span>
            </h3>
          </div>
          
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Bientôt, un nouveau chapitre de la culture créole s'ouvrira. 
            Préparez-vous à vivre des moments exceptionnels.
          </p>
          
          <div className="border-t border-white/20 pt-8">
            <div className="flex items-center justify-center text-sm opacity-75">
              <span>Fait avec</span>
              <Heart className="w-4 h-4 mx-2 text-creole-coral animate-pulse-slow" />
              <span>pour la communauté créole</span>
            </div>
            <p className="mt-4 text-sm opacity-60">
              © 2024 Club Créole. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
