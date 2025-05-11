'use client';

import { useState } from 'react';
import Link from 'next/link';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for trying out Bambi AI',
      price: {
        monthly: 0,
        annual: 0,
      },
      features: [
        '50 generations per month',
        '1 API configuration',
        'Standard resolution (1024x1024)',
        'Basic history',
        'Community support',
      ],
      cta: 'Get Started',
      ctaLink: '/signup',
      highlighted: false,
    },
    {
      name: 'Premium',
      description: 'For serious creators and professionals',
      price: {
        monthly: 5,
        annual: 50,
      },
      features: [
        'Unlimited generations',
        'Unlimited API configurations',
        'HD resolution (4K, SVG)',
        'Complete history with organization',
        'Priority support',
        'Advanced prompt tools',
      ],
      cta: 'Upgrade Now',
      ctaLink: '/signup?plan=premium',
      highlighted: true,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-bambi-card/30">
      <div className="container-landing">
        <div className="text-center mb-16">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">
            Choose the plan that fits your creative needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-8">
            <span
              className={`text-sm ${
                !isAnnual ? 'text-bambi-text' : 'text-bambi-subtext'
              }`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative mx-4 h-6 w-12 rounded-full bg-bambi-border p-1"
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-bambi-accent transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-0'
                }`}
              ></span>
            </button>
            <span
              className={`text-sm ${
                isAnnual ? 'text-bambi-text' : 'text-bambi-subtext'
              }`}
            >
              Annual <span className="text-bambi-accent">(Save 20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border ${
                plan.highlighted
                  ? 'border-bambi-accent/50 bg-bambi-card/80'
                  : 'border-bambi-border bg-bambi-card/40'
              } p-8 relative`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-bambi-accent text-xs font-medium text-white py-1 px-3 rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-bambi-subtext mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${isAnnual ? plan.price.annual : plan.price.monthly}
                </span>
                {plan.price.monthly > 0 && (
                  <span className="text-bambi-subtext ml-2">
                    {isAnnual ? '/year' : '/month'}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-bambi-accent mr-2 mt-0.5 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-bambi-subtext">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaLink}
                className={`block text-center py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-button-gradient text-white hover:shadow-[0_0_15px_rgba(123,92,250,0.5)]'
                    : 'bg-bambi-card border border-bambi-border text-bambi-text hover:border-bambi-accent/50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
