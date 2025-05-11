import Hero from '@/components/marketing/Hero';
import ProblemSolution from '@/components/marketing/ProblemSolution';
import TrustedBy from '@/components/marketing/TrustedBy';
import HowItWorks from '@/components/marketing/HowItWorks';
import ImageGallery from '@/components/marketing/ImageGallery';
import { Features } from '@/components/blocks/features-2';
import { PricingSectionDemo } from '@/components/blocks/pricing-section';
import Testimonials from '@/components/marketing/Testimonials';
import FAQ from '@/components/marketing/FAQ';
import CTA from '@/components/marketing/CTA';
import Footer from '@/components/marketing/Footer';
import { FloatingHeader } from '@/components/marketing/FloatingHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-bambi-background relative">
      <FloatingHeader />
      <main>
        <Hero />
        <TrustedBy />
        <ProblemSolution />
        <ImageGallery />
        <Features />
        <HowItWorks />
        <Testimonials />
        <PricingSectionDemo />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
