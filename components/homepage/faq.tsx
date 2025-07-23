'use client';

import {
  Bot,
  FileText,
  Languages,
  ShoppingCart,
  UserCog,
  LifeBuoy,
} from 'lucide-react';

const faq = [
  {
    icon: Bot,
    question: 'How does the AI assist in content creation and management?',
    answer:
      'Our platform uses advanced fine-tuned ChatGPT models to help publishers and authors streamline content creation, editing, and organization, making the entire process more efficient and intelligent.',
  },
  {
    icon: FileText,
    question: 'What file formats can I generate for my digital books?',
    answer:
      'You can generate a variety of popular digital book formats, including EPUB, MOBI, PDF, and HTML. We\'re also actively working on supporting audiobooks in the near future.',
  },
  {
    icon: Languages,
    question: 'Is the platform truly multilingual for both content and interface?',
    answer:
      'Yes, absolutely! Our management panel supports multiple languages, and you have the flexibility to publish your book content in any language, ensuring a global reach.',
  },
  {
    icon: ShoppingCart,
    question: 'Can I publish my books to major online retailers like Amazon and Apple?',
    answer:
      'Yes, our platform generates outputs that are built to universal standards, ensuring compatibility with all major digital book platforms, including Amazon, Kobo, Apple Books, Google Play Books, and more.',
  },
  {
    icon: UserCog,
    question: 'Do I need to be tech-savvy to use this platform?',
    answer:
      'Not at all! We\'ve designed our platform with an intuitive, user-friendly dashboard that makes creating and managing your digital book content straightforward and accessible for everyone, regardless of technical expertise.',
  },
  {
    icon: LifeBuoy,
    question: 'What kind of support is available if I encounter issues?',
    answer:
      'We offer comprehensive support to ensure your publishing journey is smooth. You can reach out to our support team for any assistance, from troubleshooting to guidance on leveraging the platform\'s features.',
  },
];

export default function FAQSection() {
  return (
    <section className="w-full">
    
      <div className="max-w-5xl mx-auto mt-12">
        <h2 className="text-center text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-center text-muted-foreground text-lg">
          Here are some common questions about our AI-powered digital book platform.
        </p>

        <div className="mt-12 grid md:grid-cols-2 ">
          {faq.map(({ icon: Icon, question, answer }) => (
            <div
              key={question}
              className={`p-6`}
            >
              <Icon className="text-tertiary size-8 mb-4 text-muted-foreground" strokeWidth={1} />
              <h3 className="text-lg font-semibold leading-snug mb-2">
                {question}
              </h3>
              <p className="text-md text-muted-foreground">{answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
