import type { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
  ogImage?: string;
  jsonLd?: Record<string, unknown>;
}

const BASE_URL = 'https://docscrive.com';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export const defaultSEO: SEOConfig = {
  title: 'DocScrive - AI-Powered Code Documentation & Translation Tools',
  description:
    'Transform your code into comprehensive documentation instantly with AI. Generate docs from GitHub repos, translate code between languages, and automate documentation workflows. Free AI-powered developer tools.',
  keywords: [
    'AI code documentation',
    'automated documentation generator',
    'GitHub documentation tools',
    'code to documentation converter',
    'AI code translator',
    'developer tools',
    'API documentation generator',
    'code documentation automation',
    'software documentation tools',
    'AI-powered development tools',
  ],
  ogImage: DEFAULT_OG_IMAGE,
};

export const seoPages = {
  home: {
    title: 'DocScrive - AI Code Documentation Generator | Free Developer Tools',
    description:
      'Generate comprehensive code documentation instantly with AI. Transform GitHub repositories, translate code between languages, and automate documentation workflows. Start free today.',
    keywords: [
      'AI code documentation generator',
      'automated documentation tools',
      'GitHub documentation generator',
      'code to documentation converter',
      'free developer tools',
      'AI code translator',
      'documentation automation',
      'software documentation generator',
    ],
  },

  documentCode: {
    title: 'AI Code Documentation Generator | Transform Code to Docs Instantly',
    description:
      'Paste your code and generate comprehensive documentation in seconds. AI-powered documentation generator supports JavaScript, Python, React, and more. Free online tool.',
    keywords: [
      'code documentation generator',
      'AI code documenter',
      'automatic code documentation',
      'JavaScript documentation generator',
      'Python documentation tool',
      'React documentation generator',
      'code to docs converter',
    ],
  },

  githubDocs: {
    title:
      'GitHub Documentation Generator | AI-Powered Repository Documentation',
    description:
      'Generate comprehensive documentation for your GitHub repositories with AI. Automatically analyze codebases, create READMEs, API docs, and technical documentation. Free GitHub integration.',
    keywords: [
      'GitHub documentation generator',
      'repository documentation tool',
      'automated README generator',
      'GitHub AI documentation',
      'repository documentation automation',
      'GitHub integration tools',
      'open source documentation',
    ],
  },

  codeTranslation: {
    title: 'AI Code Translator | Convert Code Between Programming Languages',
    description:
      'Translate code between programming languages instantly with AI. Convert JavaScript to Python, React to Vue, and more. Accurate AI-powered code translation tool.',
    keywords: [
      'AI code translator',
      'code language converter',
      'programming language translator',
      'JavaScript to Python converter',
      'code migration tool',
      'automated code translation',
      'multi-language code converter',
    ],
  },

  codeReview: {
    title: 'AI Code Review Tool | Automated Code Analysis & Quality Checks',
    description:
      'Get instant AI-powered code reviews with security, performance, and quality analysis. Improve code quality with automated code review suggestions and best practices.',
    keywords: [
      'AI code review tool',
      'automated code analysis',
      'code quality checker',
      'code security analysis',
      'performance code review',
      'automated code review',
      'code improvement suggestions',
    ],
  },

  // SEO landing pages for high-value keywords
  aiCodeDocumentation: {
    title:
      'AI Code Documentation Generator | Best Automated Documentation Tool 2025',
    description:
      'The most advanced AI code documentation generator. Automatically create comprehensive docs from any codebase. Used by 10,000+ developers. Start free.',
    keywords: [
      'AI code documentation generator',
      'best automated documentation tool',
      'AI powered code documentation',
      'automated code documentation',
      'intelligent documentation generator',
      'AI documentation tool 2025',
    ],
  },

  automatedDocumentation: {
    title:
      'Automated Documentation Tools | AI-Powered Documentation Generation',
    description:
      'Discover the best automated documentation tools for developers. Generate docs from code, APIs, and repositories with AI. Compare features and pricing.',
    keywords: [
      'automated documentation tools',
      'documentation automation software',
      'AI documentation generation',
      'automatic documentation creator',
      'smart documentation tools',
      'documentation workflow automation',
    ],
  },
};

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    noIndex = false,
    ogImage = DEFAULT_OG_IMAGE,
    jsonLd,
  } = { ...defaultSEO, ...config };

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords.join(', '),

    // Open Graph
    openGraph: {
      title,
      description,
      url: canonical || BASE_URL,
      siteName: 'DocScrive',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@docscrive',
      site: '@docscrive',
    },

    // Additional meta tags
    other: {
      'application-name': 'DocScrive',
      'apple-mobile-web-app-title': 'DocScrive',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'msapplication-config': '/browserconfig.xml',
      'msapplication-TileColor': '#2B5797',
      'msapplication-tap-highlight': 'no',
      'theme-color': '#000000',
    },

    // Canonical URL
    ...(canonical && { alternates: { canonical } }),

    // Robots
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification
    verification: {
      google: 'your-google-verification-code',
      // Add other verification codes as needed
    },
  };

  return metadata;
}

// Utility function to generate JSON-LD structured data
export function generateJsonLd(type: string, data: Record<string, unknown>) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };
}

// Common structured data schemas
export const schemaTemplates = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DocScrive',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      'AI-powered code documentation and translation tools for developers',
    sameAs: [
      'https://twitter.com/docscrive',
      'https://github.com/docscrive',
      'https://linkedin.com/company/docscrive',
    ],
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'DocScrive Team',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hi@usaid.dev',
      contactType: 'customer service',
    },
  },

  softwareApplication: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DocScrive',
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Documentation Tool',
    operatingSystem: 'Web Browser',
    description: 'AI-powered code documentation and translation tools',
    url: BASE_URL,
    screenshot: `${BASE_URL}/screenshot.png`,
    softwareVersion: '1.0.0',
    datePublished: '2024-01-01',
    author: {
      '@type': 'Organization',
      name: 'DocScrive',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free with premium features available',
    },
    featureList: [
      'AI Code Documentation Generation',
      'GitHub Repository Integration',
      'Code Translation Between Languages',
      'Automated Code Review',
      'API Documentation Generation',
    ],
    downloadUrl: BASE_URL,
    installUrl: BASE_URL,
  },

  faq: (questions: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  }),

  howTo: (name: string, steps: string[], description?: string) => ({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description: description || `Learn how to ${name.toLowerCase()}`,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text: step,
    })),
  }),
};
