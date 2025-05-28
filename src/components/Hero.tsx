import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-tropical-gradient overflow-hidden">
      {/* Éléments décoratifs flottants */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-creole-coral rounded-full opacity-20 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-creole-hibiscus rounded-full opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-creole-mango rounded-full opacity-25 animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="container mx-auto px-6 text-center text-white relative z-10">
        <div className="animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 drop-shadow-lg">
            Club<span className="text-creole-sand">Créole</span>
          </h1>
          <p className="text-2xl md:text-3xl mb-8 font-light">
            L'authenticité créole vous attend
          </p>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-12 max-w-2xl mx-auto border border-white/30">
            <div className="flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 mr-3 text-creole-sand" />
              <h2 className="text-3xl font-semibold">Ouverture Prochaine</h2>
            </div>
            <p className="text-xl mb-6">
              Préparez-vous à découvrir un espace unique proposant des services et des promotions exclusives pour les membres du Club Créole.
            </p>
            <div className="flex items-center justify-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-creole-coral" />
              <span>Bientôt révélé</span>
            </div>
          </div>
          
          <div className="space-y-4 md:space-y-0 md:space-x-6 md:flex md:justify-center">
            <Button 
              size="lg" 
              className="bg-creole-sunset hover:bg-creole-coral text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Être notifié du lancement
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-blue hover:bg-white hover:text-blue px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 backdrop-blur-sm"
            >
              En savoir plus
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
