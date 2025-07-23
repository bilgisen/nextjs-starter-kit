"use client";

import {
  LayoutDashboard,
  Globe,
  Edit,
  FileText,
  CloudUpload,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import * as React from "react";

export default function FeaturesSection() {
  return (
    <section>
      <div className="pt-12 pb-32">
        <div className="mx-auto max-w-5xl px-6">
          <div>
            <h2 className="text-balance text-3xl font-semibold md:text-3xl text-center">
              Empowering Features for Publishers
            </h2>
            <p className="text-muted-foreground mt-3 text-lg text-center">
              Launch your digital book projects with confidence, knowing you&apos;re leveraging advanced tools designed to streamline every step of your publishing journey.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<LayoutDashboard className="text-primary size-12 opacity-80 group-hover:opacity-100" strokeWidth={0.5} />}
              title="Intuitive Dashboard"
              description="Effortlessly create and manage your book content with a modern, user-friendly interface."
            />

            <FeatureCard
              icon={<Globe className="text-primary size-12 opacity-80 group-hover:opacity-100" strokeWidth={0.5} />}
              title="Global Reach"
              description="Publish your books in any language and navigate a truly multilingual management panel."
            />

            <FeatureCard
              icon={<Edit className="text-primary size-12 opacity-80 group-hover:opacity-100" strokeWidth={0.5} />}
              title="Advanced Editor"
              description="Craft your content with a powerful toolbar, adding footnotes, images, and rich formatting with ease."
            />

            <FeatureCard
              icon={<FileText className="text-primary size-12 opacity-80 group-hover:opacity-100" strokeWidth={0.5} />}
              title="Versatile Formats"
              description="Generate your books in multiple popular formats like EPUB, MOBI, PDF, and HTML. Audiobooks coming soon!"
            />

            <FeatureCard
              icon={<CloudUpload className="text-primary size-12 opacity-80 group-hover:opacity-100" strokeWidth={0.5} />}
              title="Universal Compatibility"
              description="Produce universally compliant outputs for major platforms including Amazon, Kobo, Apple, Google, and more."
            />

            <FeatureCard
              icon={<Sparkles className="text-primary size-12 opacity-80 group-hover:opacity-100" strokeWidth={0.5} />}
              title="AI-Powered Assistant"
              description="Leverage the most advanced ChatGPT models, fine-tuned specifically for publishers' needs."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-6 h-full transition-shadow hover:shadow-lg rounded-md group">
      <div className="flex flex-col items-start gap-4">
        {icon}
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}
