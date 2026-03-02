// app/faq/page.tsx
'use client';
import React from 'react';
import Footer from '../components/Footer';
import Navbar from '../components/NavBar';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

export default function Page() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Navbar />

      <div className="container py-6">
        <header className="mb-6 text-center">
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <HelpCircle className="text-primary h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground mt-2">
            Find answers to common questions about our AI tools
          </p>
        </header>
      </div>

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      What is an AI code documentation generator?
                    </AccordionTrigger>
                    <AccordionContent>
                      An AI code documentation generator is a tool that
                      automatically creates comprehensive documentation for your
                      code using artificial intelligence. It analyzes your
                      codebase, understands the structure and functionality, and
                      generates readable documentation including API references,
                      setup instructions, and usage examples.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>
                      How does DocScrive's automated documentation work?
                    </AccordionTrigger>
                    <AccordionContent>
                      DocScrive uses advanced AI models to analyze your code
                      structure, comments, and patterns. It can process GitHub
                      repositories, individual files, or code snippets to
                      generate detailed documentation including README files,
                      API documentation, code explanations, and setup guides
                      automatically.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>
                      Can I generate documentation from private GitHub
                      repositories?
                    </AccordionTrigger>
                    <AccordionContent>
                      Yes, DocScrive supports both public and private GitHub
                      repositories. You can securely connect your GitHub account
                      to generate documentation from any repository you have
                      access to. Your code remains private and secure throughout
                      the process.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>
                      What programming languages does the AI code translator
                      support?
                    </AccordionTrigger>
                    <AccordionContent>
                      DocScrive's AI code translator supports popular
                      programming languages including JavaScript, Python,
                      TypeScript, Java, C++, C#, Go, Rust, PHP, Ruby, and more.
                      You can translate code snippets or entire files between
                      different programming languages while maintaining
                      functionality.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger>
                      Is DocScrive free to use?
                    </AccordionTrigger>
                    <AccordionContent>
                      Yes, DocScrive offers free access to core features
                      including code documentation generation, GitHub repository
                      documentation, and basic code translation. Premium
                      features with advanced AI models and higher usage limits
                      are available for power users.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6">
                    <AccordionTrigger>
                      Can I customize the documentation format and style?
                    </AccordionTrigger>
                    <AccordionContent>
                      Yes, DocScrive offers multiple output formats including
                      Markdown and PDF. You can customize the documentation
                      style, structure, and include specific sections like
                      installation guides, API references, and troubleshooting
                      sections.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-7">
                    <AccordionTrigger>
                      How does the GitHub integration work?
                    </AccordionTrigger>
                    <AccordionContent>
                      DocScrive integrates seamlessly with GitHub through OAuth
                      authentication. Once connected, you can select any
                      repository, configure documentation preferences, and
                      generate comprehensive documentation that includes README
                      files, API docs, and technical specifications based on
                      your codebase.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-8">
                    <AccordionTrigger>
                      Are my API keys safe and secure?
                    </AccordionTrigger>
                    <AccordionContent>
                      Yes, your API keys are completely safe with DocScrive.
                      While your API keys are sent to our backend to generate
                      documentation and process your requests, we do not store
                      or save them in any database. Your API keys are only
                      stored in your browser's local storage and are used
                      temporarily for processing. You maintain full control and
                      can remove them at any time. We ensure maximum security
                      and privacy for your sensitive credentials.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
