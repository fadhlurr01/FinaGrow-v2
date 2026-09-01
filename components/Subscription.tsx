import React, { useState } from 'react';
import { CheckIcon } from './icons/IconComponents';
import { useFMS } from '../context/FMSContext';

interface SubscriptionProps {
  onNavigate: (state: 'landing' | 'auth' | 'subscription' | 'app') => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ onNavigate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { state, upgradeToProApi } = useFMS();

  const handleSubscribe = async (plan: 'Pro' | 'Enterprise' = 'Pro') => {
    setIsLoading(true);
    try {
      await upgradeToProApi(plan);
    } catch (e) {
      console.warn('Upgrade call complete:', e);
    }
    setTimeout(() => {
      setIsLoading(false);
      onNavigate('app');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">Pricing</h2>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
            Choose the right plan for your business
          </p>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
            Start with our 14-day free trial. No credit card required. Upgrade anytime as you grow.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {/* Starter Plan */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-3xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 transition-transform hover:-translate-y-1 hover:shadow-xl">
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Starter</h3>
              <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Perfect for freelancers and small UMKM.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">Rp 150k</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mo</span>
              </p>
              <button onClick={handleSubscribe} disabled={isLoading} className="mt-8 block w-full bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-white border border-transparent rounded-xl py-3 px-6 text-center font-bold hover:bg-primary-100 dark:hover:bg-gray-600 transition-colors">
                Start Free Trial
              </button>
            </div>
            <div className="pt-6 pb-8 px-8">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">What's included</h4>
              <ul className="mt-6 space-y-4">
                <FeatureItem text="Up to 100 transactions/mo" />
                <FeatureItem text="Basic Invoicing" />
                <FeatureItem text="1 User" />
                <FeatureItem text="Standard Reports" />
              </ul>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-primary-500 rounded-3xl shadow-xl divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 relative transform scale-105 z-10">
            <div className="absolute top-0 inset-x-0 transform -translate-y-1/2 flex justify-center">
              <span className="bg-primary-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</span>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Professional</h3>
              <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">For growing businesses with teams.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">Rp 450k</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mo</span>
              </p>
              <button onClick={handleSubscribe} disabled={isLoading} className="mt-8 block w-full bg-primary-600 text-white border border-transparent rounded-xl py-3 px-6 text-center font-bold hover:bg-primary-700 transition-colors shadow-md">
                {isLoading ? 'Processing...' : 'Start Free Trial'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-8">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">Everything in Starter, plus</h4>
              <ul className="mt-6 space-y-4">
                <FeatureItem text="Unlimited transactions" />
                <FeatureItem text="Up to 5 Users" />
                <FeatureItem text="Payroll Management" />
                <FeatureItem text="Inventory Tracking" />
                <FeatureItem text="AI Financial Assistant" />
              </ul>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-3xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 transition-transform hover:-translate-y-1 hover:shadow-xl">
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Enterprise</h3>
              <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Advanced features for complex operations.</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">Rp 1.5M</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mo</span>
              </p>
              <button onClick={handleSubscribe} disabled={isLoading} className="mt-8 block w-full bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-white border border-transparent rounded-xl py-3 px-6 text-center font-bold hover:bg-primary-100 dark:hover:bg-gray-600 transition-colors">
                Contact Sales
              </button>
            </div>
            <div className="pt-6 pb-8 px-8">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide uppercase">Everything in Pro, plus</h4>
              <ul className="mt-6 space-y-4">
                <FeatureItem text="Multi-Entity Consolidation" />
                <FeatureItem text="Unlimited Users" />
                <FeatureItem text="Advanced Custom Roles" />
                <FeatureItem text="API Access" />
                <FeatureItem text="Dedicated Account Manager" />
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex space-x-3">
    <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
    <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
  </li>
);

export default Subscription;
