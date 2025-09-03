import { checkoutAction } from '@/lib/payments/actions';
import { Check, Star, Zap } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Prices are fresh for one hour max
export const revalidate = 3600;

type PricingPlan = {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  isPopular?: boolean;
  icon?: React.ReactNode;
  description?: string;
};

export default async function PricingPage() {
  try {
    const [prices, products] = await Promise.all([
      getStripePrices(),
      getStripeProducts(),
    ]);

    const basePlan = products.find((product) => product.name === 'Base');
    const plusPlan = products.find((product) => product.name === 'Plus');

    const basePrice = prices.find((price) => price.productId === basePlan?.id);
    const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

    const plans: PricingPlan[] = [
      {
        name: basePlan?.name || 'Base',
        price: basePrice?.unitAmount || 800,
        interval: basePrice?.interval || 'month',
        trialDays: basePrice?.trialPeriodDays || 7,
        description: 'Perfect for small teams getting started',
        icon: <Zap className="h-6 w-6 text-primary" />,
        features: [
          'Unlimited Usage',
          'Unlimited Workspace Members',
          'Email Support',
          'Basic Analytics',
          'Standard Security',
        ],
        priceId: basePrice?.id,
        isPopular: false,
      },
      {
        name: plusPlan?.name || 'Plus',
        price: plusPrice?.unitAmount || 1200,
        interval: plusPrice?.interval || 'month',
        trialDays: plusPrice?.trialPeriodDays || 7,
        description: 'Best for growing teams and businesses',
        icon: <Star className="h-6 w-6 text-primary" />,
        features: [
          'Everything in Base',
          'Early Access to New Features',
          '24/7 Support + Slack Access',
          'Advanced Analytics',
          'Priority Support',
          'Custom Integrations',
        ],
        priceId: plusPrice?.id,
        isPopular: true,
      },
    ];

    return (
      <main className="min-h-screen bg-background">
        <div className="">
          {/* Header Section */}
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Choose the plan that's right for your team. Start with a free trial and upgrade anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-12 sm:mt-16 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              All plans include a {plans[0]?.trialDays || 7}-day free trial. No credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span>✓ Cancel anytime</span>
              <span>✓ 30-day money-back guarantee</span>
              <span>✓ No setup fees</span>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading pricing data:', error);
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Pricing temporarily unavailable
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            We're having trouble loading our pricing information. Please try again later.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }
}

function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <Card 
      className={`relative pt-6 sm:pt-8 transition-all duration-300 hover:shadow-xl ${
        plan.isPopular 
          ? 'border-primary shadow-lg lg:scale-105 bg-card' 
          : 'hover:border-border'
      }`}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-6 sm:pb-8">
        <div className="flex justify-center mb-3 sm:mb-4">
          {plan.icon}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{plan.name}</h2>
        <p className="text-sm text-muted-foreground mb-4 px-2">{plan.description}</p>
        
        <div className="mb-4">
          <div className="flex items-baseline justify-center">
            <span className="text-3xl sm:text-4xl font-bold text-foreground">
              ${Math.floor((plan.price || 0) / 100)}
            </span>
            <span className="text-base sm:text-lg text-muted-foreground ml-1">
              /{plan.interval}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            per user • {plan.trialDays} day free trial
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-6 sm:px-8">
        <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className="flex-shrink-0">
                <Check className={`h-4 w-4 sm:h-5 sm:w-5 mt-0.5 ${
                  plan.isPopular ? 'text-primary' : 'text-primary'
                }`} />
              </div>
              <span className="ml-3 text-foreground text-sm leading-6">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="px-6 sm:px-8 pt-0">
        <form action={checkoutAction} className="w-full">
          <input type="hidden" name="priceId" value={plan.priceId} />
          <SubmitButton isPopular={plan.isPopular} />
        </form>
      </CardFooter>
    </Card>
  );
}
