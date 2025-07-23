"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ArrowUpRight, CircleCheck } from "lucide-react";
import { useState } from "react";

const YEARLY_DISCOUNT = 20;
const plans = [
  {
    name: "Starter",
    price: 10,
    description:
      "Take advantage of the option to publish 15 books by subscribing annually.",
    features: [
      { title: "Publish 1 books per month" },
      { title: "Epub, Mobi, PDF" },
      { title: "AI Assistant"},
      { title: "Online Support"},
    ],
  },
  {
    name: "Advanced",
    price: 20,
    isRecommended: true,
    description:
      "Take advantage of the option to publish 30 books by subscribing annually.",
    features: [
      { title: "Publish 2 books per month" },
      { title: "Epub, Mobi, PDF" },
      { title: "AI Assistant"},
      { title: "Online Support"},
    ],
    isPopular: true,
  },
  {
    name: "Premium",
    price: 40,
    description:
      "Take advantage of the option to publish 50 books by subscribing annually.",
    features: [
      { title: "Publish 3 books per month" },
      { title: "Epub, Mobi, PDF" },
      { title: "AI Assistant"},
      { title: "Online Support"},
    ],
  },
];

const Pricing04 = () => {
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("monthly");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-6">
      <h1 className="text-5xl font-bold text-center tracking-tight">Pricing</h1>
      <Tabs
        value={selectedBillingPeriod}
        onValueChange={setSelectedBillingPeriod}
        className="mt-8"
      >
        <TabsList className="h-11 bg-background border px-1.5 rounded-full">
          <TabsTrigger
            value="monthly"
            className="px-4 py-1.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Monthly
          </TabsTrigger>
          <TabsTrigger
            value="yearly"
            className="px-4 py-1.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Yearly (Save {YEARLY_DISCOUNT}%)
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-12 max-w-screen-lg mx-auto grid grid-cols-1 lg:grid-cols-3 items-center gap-8 lg:gap-0">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn("relative p-6 bg-background border px-8", {
              "shadow-[0px_2px_10px_0px_rgba(0,0,0,0.1)] py-14 z-[1] px-10 lg:-mx-2 overflow-hidden":
                plan.isPopular,
            })}
          >
            {plan.isPopular && (
              <Badge className="absolute top-10 right-10 rotate-[45deg] rounded-none px-10 uppercase translate-x-1/2 -translate-y-1/2">
                Most Popular
              </Badge>
            )}
            <h3 className="text-lg font-medium">{plan.name}</h3>
            <p className="mt-2 text-4xl font-bold">
              $
              {selectedBillingPeriod === "monthly"
                ? plan.price
                : plan.price * ((100 - YEARLY_DISCOUNT) / 100)}
              <span className="ml-1.5 text-sm text-muted-foreground font-normal">
                /month
              </span>
            </p>
            <p className="mt-4 font-medium text-muted-foreground">
              {plan.description}
            </p>

            <Button
              variant={plan.isPopular ? "default" : "outline"}
              size="lg"
              className="w-full mt-6 rounded-full text-base"
            >
              Get Started <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Separator className="my-8" />
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-1.5">
                  <CircleCheck className="h-4 w-4 mt-1 text-green-600" />
                  {feature.title}                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
<p className="text-muted-foreground">
  Need a custom plan?{" "}
  <span className="text-primary cursor-pointer hover:underline">
    Contact us
  </span>
</p>
</div>
    </div>
  );
};



export default Pricing04;
