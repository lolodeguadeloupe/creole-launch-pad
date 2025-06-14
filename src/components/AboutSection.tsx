import { Card, CardContent } from "@/components/ui/card";
import { Music, Utensils, Users, Heart } from "lucide-react";

const AboutSection = () => {
  const features = [
    {
      icon: Music,
      title: "Musique & Culture",
      description: "Découvrez les concert , les soirées, les festivals, les événements culturels"
    },
    {
      icon: Utensils,
      title: "Restaurants",
      description: "Découvrez les restaurants partenaires, les plats typiques, les spécialités culinaires"
    },
    {
      icon: Users,
      title: "Communauté",
      description: "Rejoignez une communauté passionnée et partagez des moments inoubliables avec les autres membres"
    },
    {
      icon: Heart,
      title: "Authenticité",
      description: "Vivez l'expérience créole dans toute sa richesse et sa diversité avec les autres membres"
    }
  ];

  return (
    <section id="about-section" className="py-20 bg-gradient-to-b from-white to-creole-sand/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-bold text-creole-ocean mb-6">
            Une expérience créole unique
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Club Créole vous permet de bénéficier de services privilégiés et de promotions exclusives grâce à notre réseau de partenaires sélectionnés.
            Profitez d'avantages uniques pour vivre pleinement l'expérience "Club Créole" au meilleur prix.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-sunset-gradient rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-creole-ocean mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center bg-ocean-gradient rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-6">Préparez-vous à l'aventure du Club Créole</h3>
          <p className="text-xl mb-8 opacity-90">
            Nous préparons quelque chose d'exceptionnel pour vous faire bénéficier de services privilégiés et de promotions exclusives grâce à notre réseau de partenaires sélectionnés.
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold">2025</div>
              <div className="opacity-75">Ouverture</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold">100%</div>
              <div className="opacity-75">Authentique</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold">∞</div>
              <div className="opacity-75">Passion</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
