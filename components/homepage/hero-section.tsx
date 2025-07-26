'use client';

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  const fullText = "Publish Your Digital Books Easily";

  return (
    <section className="py-16">
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 lg:px-0">
        <div className="relative text-center">

          <p className="text-lg lg:text-2xl mt-0 lg:mt-12 text-primary">Powered by AI</p>

          <h1 className="mx-auto mt-8 mb-4 max-w-5xl text-balance text-4xl lg:text-7xl font-medium leading-tight">
            <span className="text-muted-foreground">Go Digital, Go Simple:</span>{" "}
            <span className="inline-block">
              <motion.span
                className="text-foreground"
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{
                  duration: 2,
                  ease: [0.25, 1, 0.5, 1],
                  type: "tween",
                  times: [0, 1],
                }}
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                }}
              >
                {fullText}
              </motion.span>
              <motion.span
                className="ml-1 inline-block text-muted-foreground"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                |
              </motion.span>
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto mb-8 mt-6 text-balance text-xl">
            Transform your book into a stunning digital version with our intuitive platform. Publishers and authors enjoy a fast, seamless process that delivers a flawless reader experience.
          </p>

          <div className="flex flex-col items-center gap-2 *:w-full sm:flex-row sm:justify-center sm:*:w-auto">
            <Button asChild variant="default" size="lg" className="px-6 py-2">
              <Link href="/dashboard" prefetch={true}>
                <span className="text-nowrap">Create a book for free</span>
              </Link>
            </Button>
          </div>

          <div className="text-muted-foreground text-sm pt-3">No credit card required</div>

        </div>
      </div>
    </section>
  );
}
