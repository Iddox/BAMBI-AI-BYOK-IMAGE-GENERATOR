import React from 'react';

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 bg-bambi-background">
      <div className="container-landing">
        <div className="text-center mb-16">
          <h2 className="section-title">La vision du fondateur</h2>
          <p className="section-subtitle">
            Créé par des développeurs, pour des créateurs
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-bambi-card border border-bambi-border hover:border-bambi-accent/50 transition-colors duration-300 rounded-xl p-8 md:p-10 relative overflow-hidden">
            {/* Guillemets décoratifs */}
            <div className="absolute top-6 left-6 opacity-10">
              <svg
                className="h-24 w-24 text-bambi-accent"
                fill="currentColor"
                viewBox="0 0 32 32"
                aria-hidden="true"
              >
                <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
              </svg>
            </div>

            {/* Témoignage */}
            <div className="relative z-10">
              <p className="text-bambi-text text-lg md:text-xl mb-8 leading-relaxed">
                "En tant que développeur, j'étais constamment <span className="text-bambi-accent font-semibold">frustré par la complexité d'utilisation des clés API</span> pour générer des images. Les <span className="text-bambi-accent font-semibold">installations complexes en local</span> et la manipulation via l'invite de commande (CMD) étaient un vrai cauchemar. Je trouvais absurde de devoir payer des abonnements coûteux à d'autres services alors que je possédais déjà mes propres crédits API et que je voulais simplement gérer mon budget comme je l'entendais. Et le pire ! <span
  className="text-bambi-accent font-semibold relative"
  style={{
    textDecoration: 'none',
    backgroundImage: 'linear-gradient(90deg, #7B5CFA 0%, #5E3DCE 100%)',
    backgroundSize: '100% 2px',
    backgroundPosition: '0 100%',
    backgroundRepeat: 'no-repeat',
    paddingBottom: '2px',
    textShadow: '0 0 5px rgba(123, 92, 250, 0.3)'
  }}
>Aucune solution sur le marché ne permettait d'utiliser simplement ses propres clés</span>. J'ai créé Bambi AI pour résoudre ce problème une fois pour toutes - une interface <span className="text-bambi-accent font-semibold">simple et intuitive</span> où vous pouvez utiliser vos propres clés API en toute sécurité, générer des images rapidement, et garder le <span className="text-bambi-accent font-semibold">contrôle total sur vos coûts</span>. C'est la solution que j'aurais aimé avoir dès le début."
              </p>

              <div className="flex items-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-bambi-accent to-bambi-accentDark flex items-center justify-center text-white font-bold text-lg">
                  AN
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-lg">Amenallah Nefzi</h4>
                  <p className="text-bambi-subtext">Fondateur de Bambi AI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
