'use client';

import Head from 'next/head';
import { JsonLd } from './JsonLd';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown>;
  children?: React.ReactNode;
}

export function SEOHead({
  title,
  description,
  canonical,
  noIndex = false,
  jsonLd,
  children,
}: SEOHeadProps) {
  return (
    <>
      {title && (
        <Head>
          <title>{title}</title>
        </Head>
      )}

      {description && (
        <Head>
          <meta name="description" content={description} />
        </Head>
      )}

      {canonical && (
        <Head>
          <link rel="canonical" href={canonical} />
        </Head>
      )}

      {noIndex && (
        <Head>
          <meta name="robots" content="noindex,nofollow" />
        </Head>
      )}

      {jsonLd && <JsonLd data={jsonLd} />}

      {children}
    </>
  );
}

export default SEOHead;
