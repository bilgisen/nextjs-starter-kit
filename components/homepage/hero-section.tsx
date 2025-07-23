import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="py-16">
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 lg:px-0">
        <div className="relative text-center">
          
          <p className="text-2xl mt-12 text-primary"> Powered by AI </p>
          <h1 className="mx-auto mt-8 mb-4 max-w-5xl text-balance text-7xl font-medium">
          Go Digital, Go Simple: Publish Your Digital Books Easily          </h1>
          <p className="text-muted-foreground mx-auto mb-8 mt-6 text-balance text-xl">
          Transform your book into a stunning digital version with our intuitive platform. Publishers and authors enjoy a fast, seamless process that delivers a flawless reader experience.</p>          
          <div className="flex flex-col items-center gap-2 *:w-full sm:flex-row sm:justify-center sm:*:w-auto">
            <Button asChild variant="default" size="lg">
              <Link href="/dashboard" prefetch={true}>
                <span className="text-nowrap">Try for free</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
