import React from 'react';
import { Mail, ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Contact - DocScrive',
  description: 'Get in touch with the DocScrive team.',
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030303] px-4 pb-24 pt-32 text-white sm:px-6 lg:px-8">
        {/* Background Ornaments */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(46,204,113,0.05)_0,transparent_50%)]" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2ecc71]/10 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-2xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#2ecc71]/20 bg-[#2ecc71]/10 px-4 py-1.5 text-sm font-medium text-[#2ecc71] backdrop-blur-md">
            <Sparkles className="h-4 w-4" />
            <span>We'd love to hear from you</span>
          </div>

          <h1 className="mb-6 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl">
            Get in Touch
          </h1>

          <p className="mx-auto mb-12 max-w-xl text-lg text-zinc-400">
            Whether you have a question about features, pricing, need a demo, or
            anything else, our team is ready to answer all your questions.
          </p>

          <div className="mx-auto max-w-md">
            <div className="group relative rounded-3xl bg-gradient-to-b from-white/10 to-transparent p-[1px] transition-all duration-500 hover:from-white/20">
              <div className="relative flex flex-col items-center justify-center gap-6 rounded-[23px] bg-[#0a0a0c]/80 px-8 py-12 backdrop-blur-xl">
                <div className="rounded-2xl bg-[#2ecc71]/10 p-4 ring-1 ring-white/10">
                  <Mail className="h-8 w-8 text-[#2ecc71]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    Email Us Directly
                  </h3>
                  <p className="text-sm text-zinc-400">
                    We typically respond within 24 hours.
                  </p>
                </div>

                <a
                  href="mailto:hi@usaid.dev"
                  className="group/btn relative mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#27ae60] px-6 py-4 text-base font-semibold text-black shadow-[0_0_20px_rgba(46,204,113,0.2)] transition-all duration-300 hover:scale-[1.02] hover:from-[#27ae60] hover:to-[#219a52] hover:shadow-[0_0_30px_rgba(46,204,113,0.3)] active:scale-[0.98]"
                >
                  <Mail className="h-5 w-5" />
                  <span>hi@usaid.dev</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
