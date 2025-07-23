"use client";

import Image from "next/image";

const features = [
  {
    category: "Publishing Options",
    title: "Flexible Outputs",
    details:
      "Generate your books in a comprehensive array of popular digital formats including EPUB, MOBI, PDF, DOC, and HTML, ensuring your content is accessible across diverse devices and platforms. We're also excited to announce that audiobook support is coming soon, further expanding your reach and audience.",
    image: "https://image.eventmice.com/upload-1752550747918.png",
  },
  {
    category: "Content Management",
    title: "Powerfull Rich Text Editor",
    details:
      "Craft your content with an advanced toolbar, effortlessly adding footnotes, images, and rich formatting. Easily import content from Microsoft Word, HTML, and other sources, while AI-powered grammar checks ensure your writing is polished and professional.",
    image: "https://image.eventmice.com/upload-1752574318335.png",
  },
  {
    category: "Book Distributing",
    title: "Reach Global Audiences",
    details:
      "Produce universally compliant outputs for all major ebook platforms and marketplaces, including Amazon Kindle, Kobo, Apple Books, Google Play Books, Barnes & Noble Nook, and many more, ensuring your titles reach readers worldwide.",
    image: "https://image.eventmice.com/upload-1752556519178.png",
  },
];

const Features2 = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-background mt-25 mb-25">
     
      <div className="max-w-screen-lg w-full px-6 ">
        <div className="space-y-20 ">
          {features.map((feature, index) => (
            <div
              key={feature.category}
              className={`flex flex-col md:flex-row items-center gap-20  ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="w-full md:w-1/2 aspect-[6/4] relative rounded-2xl overflow-hidden border-1 shadow-sm">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                />
              </div>
              
              <div className="w-full md:w-1/2 space-y-4">
                <span className="uppercase font-semibold text-sm text-muted-foreground">
                  {feature.category}
                </span>
                <h3 className="text-2xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-[17px]">
                  {feature.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </section>
    
  );
};

export default Features2;
