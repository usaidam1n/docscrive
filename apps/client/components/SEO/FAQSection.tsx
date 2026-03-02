'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { JsonLd } from './JsonLd';
import { schemaTemplates } from '../../lib/seo';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'What is an AI code documentation generator?',
    answer:
      'An AI code documentation generator is a tool that automatically creates comprehensive documentation for your code using artificial intelligence. It analyzes your codebase, understands the structure and functionality, and generates readable documentation including API references, setup instructions, and usage examples.',
  },
  {
    question: "How does DocScrive's automated documentation work?",
    answer:
      'DocScrive uses advanced AI models to analyze your code structure, comments, and patterns. It can process GitHub repositories, individual files, or code snippets to generate detailed documentation including README files, API documentation, code explanations, and setup guides automatically.',
  },
  {
    question: 'Can I generate documentation from private GitHub repositories?',
    answer:
      'Yes, DocScrive supports both public and private GitHub repositories. You can securely connect your GitHub account to generate documentation from any repository you have access to. Your code remains private and secure throughout the process.',
  },
  {
    question: 'What programming languages does the AI code translator support?',
    answer:
      "DocScrive's AI code translator supports popular programming languages including JavaScript, Python, TypeScript, Java, C++, C#, Go, Rust, PHP, Ruby, and more. You can translate code snippets or entire files between different programming languages while maintaining functionality.",
  },
  {
    question: 'Is DocScrive free to use?',
    answer:
      'Yes, DocScrive offers free access to core features including code documentation generation, GitHub repository documentation, and basic code translation. Premium features with advanced AI models and higher usage limits are available for power users.',
  },
  {
    question: 'Can I customize the documentation format and style?',
    answer:
      'Yes, DocScrive offers multiple output formats including Markdown and PDF. You can customize the documentation style, structure, and include specific sections like installation guides, API references, and troubleshooting sections.',
  },
  {
    question: 'How does the GitHub integration work?',
    answer:
      'DocScrive integrates seamlessly with GitHub through OAuth authentication. Once connected, you can select any repository, configure documentation preferences, and generate comprehensive documentation that includes README files, API docs, and technical specifications based on your codebase.',
  },
  {
    question: 'Are my API keys safe and secure?',
    answer:
      "Yes, your API keys are completely safe with DocScrive. While your API keys are sent to our backend to generate documentation and process your requests, we do not store or save them in any database. Your API keys are only stored in your browser's local storage and are used temporarily for processing. You maintain full control and can remove them at any time. We ensure maximum security and privacy for your sensitive credentials.",
  },
];

interface FAQSectionProps {
  id?: string;
  className?: string;
}

export function FAQSection({ id, className = '' }: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const faqSchema = schemaTemplates.faq(faqData);

  return (
    <section id={id} className={`relative py-32 ${className} scroll-mt-28`}>
      <JsonLd data={faqSchema} />

      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[150px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-6 text-4xl font-medium tracking-tight text-white md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-2xl text-lg font-normal text-zinc-400">
            Everything you need to know about DocScrive, AI code documentation
            generation, and our automated workflows.
          </p>
        </motion.div>

        <div className="mx-auto flex flex-col gap-4">
          {faqData.map((item, index) => {
            const isOpen = openItems.includes(index);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div
                  className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? 'border-white/20 bg-white/5 shadow-xl shadow-black/50'
                      : 'border-white/5 bg-zinc-950/50 hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between p-6 text-left"
                  >
                    <h3
                      className={`pr-8 text-lg font-medium tracking-tight transition-colors ${isOpen ? 'text-white' : 'text-zinc-300'}`}
                    >
                      {item.question}
                    </h3>
                    <div
                      className={`flex-shrink-0 rounded-full p-1 transition-colors ${isOpen ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}
                    >
                      {isOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 pt-0 text-base leading-relaxed text-zinc-400">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative mt-16 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-zinc-900 to-black p-8 text-center shadow-lg"
        >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
          <h3 className="relative z-10 mb-2 text-xl font-medium text-white">
            Still have questions?
          </h3>
          <p className="relative z-10 mb-6 text-zinc-400">
            Can't find the answer you're looking for? Please reach out to our
            team.
          </p>
          <a
            href="mailto:hi@usaid.dev"
            className="relative z-10 inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-md transition-transform hover:scale-105"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default FAQSection;
