'use client'

import Image from 'next/image'
import AmazonLogo from '@/components/logos/amazon'

const topPlatforms = [
  {
    name: 'Amazon Kindle',
    LogoComponent: AmazonLogo,
    link: 'https://amazon.com/kindle',
  },
  {
    name: 'Apple Books',
    logo: '/logos/apple-books.svg',
    link: 'https://books.apple.com',
  },
  {
    name: 'Google Books',
    logo: '/logos/google-books.svg',
    link: 'https://books.google.com',
  },
]

const bottomPlatforms = [
  {
    name: 'Kobo',
    logo: '/logos/kobo.svg',
    link: 'https://www.kobo.com',
  },
  {
    name: 'Barnes & Noble',
    logo: '/logos/barnes-noble.svg',
    link: 'https://www.barnesandnoble.com',
  },
]

export default function EbookPlatforms() {
  return (
    <section className="py-20 bg-background text-foreground">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-semibold mb-12">
          Available on your favorite platforms
        </h2>

        <div className="flex flex-col items-center gap-12">
          {/* Top Grid: 3 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {topPlatforms.map(({ name, link, logo, LogoComponent }) => (
              <a
                key={name}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <div className="h-16 w-auto mx-auto">
                  {LogoComponent ? (
                    <LogoComponent className="w-20 h-auto text-black dark:text-white" />
                  ) : (
                    <Image
                      src={logo!}
                      alt={name}
                      width={280}
                      height={80}
                      className="h-16 w-auto mx-auto dark:invert"
                    />
                  )}
                </div>
              </a>
            ))}
          </div>

          {/* Bottom Grid: 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {bottomPlatforms.map(({ name, logo, link }) => (
              <a
                key={name}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <Image
                  src={logo}
                  alt={name}
                  width={80}
                  height={80}
                  className="h-16 w-auto mx-auto dark:invert"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
