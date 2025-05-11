import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Shield, Sparkles, Zap } from 'lucide-react'
import { ReactNode } from 'react'

export function Features() {
    return (
        <section id="features" className="py-16 md:py-32 bg-bambi-background">
            <div className="container-landing">
                <div className="text-center mb-16">
                    <h2 className="section-title">Des fonctionnalités conçues pour vous simplifier la vie</h2>
                    <p className="section-subtitle">Une plateforme flexible, sécurisée et intuitive qui transforme la génération d'images IA en expérience agréable.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="group border-0 bg-bambi-card shadow-none hover:border-bambi-accent/50 transition-colors duration-300">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Shield className="size-6 text-bambi-accent" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-xl">Vos clés API totalement sécurisées</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-bambi-subtext">Vos clés API sont chiffrées avec AES-256 et jamais exposées côté frontend, pour une sécurité et confidentialité maximales.</p>
                        </CardContent>
                    </Card>

                    <Card className="group border-0 bg-bambi-card shadow-none hover:border-bambi-accent/50 transition-colors duration-300">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Zap className="size-6 text-bambi-accent" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-xl">Contrôle total de vos coûts</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-bambi-subtext">Utilisez uniquement les crédits que vous avez déjà achetés, sans frais supplémentaires ni abonnements coûteux.</p>
                        </CardContent>
                    </Card>

                    <Card className="group border-0 bg-bambi-card shadow-none hover:border-bambi-accent/50 transition-colors duration-300">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Sparkles className="size-6 text-bambi-accent" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-xl">Interface intuitive</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-bambi-subtext">Générez des images en quelques clics, sans compétences techniques, grâce à une interface simple et conviviale.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div aria-hidden className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"/>
        <div className="bg-bambi-card absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l border-bambi-accent/50">{children}</div>
    </div>
)
