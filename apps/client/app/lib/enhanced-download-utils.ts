/**
 * Enhanced client-side download utilities for documentation
 * FAANG-level implementation with beautiful Tailwind styling and semantic HTML
 */

export interface DownloadOptions {
  content: string;
  format: 'markdown' | 'html' | 'pdf' | 'notion' | 'confluence';
  structure: 'single-file' | 'hierarchical' | 'modular';
  projectName: string;
  metadata?: any;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(href: string): string | null {
  const trimmed = href.trim();
  // Disallow obvious dangerous schemes
  if (/^(javascript|data):/i.test(trimmed)) {
    return null;
  }
  // Allow relative URLs
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (
      url.protocol === 'http:' ||
      url.protocol === 'https:' ||
      url.protocol === 'mailto:'
    ) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Download a file directly from the browser
 */
function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);

  return {
    filename,
    size: blob.size,
    mimeType,
  };
}

/**
 * Parse markdown content into structured sections for semantic HTML generation
 */
function parseMarkdownToSections(
  content: string,
  projectName: string
): {
  sections: Array<{
    id: string;
    title: string;
    content: string;
    level: number;
    type:
      | 'overview'
      | 'installation'
      | 'usage'
      | 'api'
      | 'examples'
      | 'contributing'
      | 'other';
  }>;
  tableOfContents: Array<{ id: string; title: string; level: number }>;
} {
  const lines = content.split('\n');
  const sections: Array<{
    id: string;
    title: string;
    content: string;
    level: number;
    type:
      | 'overview'
      | 'installation'
      | 'usage'
      | 'api'
      | 'examples'
      | 'contributing'
      | 'other';
  }> = [];

  let currentSection: any = null;
  let currentContent: string[] = [];

  // Add project overview as first section if no initial header
  if (!content.startsWith('#')) {
    sections.push({
      id: 'overview',
      title: projectName,
      content: '',
      level: 1,
      type: 'overview',
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      }

      // Start new section
      const level = headerMatch[1].length;
      const title = headerMatch[2];
      const id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Determine section type based on title
      let type:
        | 'overview'
        | 'installation'
        | 'usage'
        | 'api'
        | 'examples'
        | 'contributing'
        | 'other' = 'other';
      const titleLower = title.toLowerCase();
      if (
        titleLower.includes('install') ||
        titleLower.includes('setup') ||
        titleLower.includes('getting started')
      )
        type = 'installation';
      else if (
        titleLower.includes('usage') ||
        titleLower.includes('how to') ||
        titleLower.includes('guide')
      )
        type = 'usage';
      else if (
        titleLower.includes('api') ||
        titleLower.includes('reference') ||
        titleLower.includes('methods')
      )
        type = 'api';
      else if (
        titleLower.includes('example') ||
        titleLower.includes('demo') ||
        titleLower.includes('sample')
      )
        type = 'examples';
      else if (
        titleLower.includes('contribut') ||
        titleLower.includes('develop') ||
        titleLower.includes('maintainer')
      )
        type = 'contributing';
      else if (
        titleLower.includes('overview') ||
        titleLower.includes('about') ||
        level === 1
      )
        type = 'overview';

      currentSection = { id, title, content: '', level, type };
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  } else if (sections.length === 0) {
    // No headers found, create a single overview section
    sections.push({
      id: 'overview',
      title: projectName,
      content: content,
      level: 1,
      type: 'overview',
    });
  }

  // Generate table of contents
  const tableOfContents = sections.map(section => ({
    id: section.id,
    title: section.title,
    level: section.level,
  }));

  return { sections, tableOfContents };
}

/**
 * Convert markdown content to semantic HTML with advanced styling
 */
function convertMarkdownToHTML(markdown: string): string {
  return (
    markdown
      // Headers (will be handled separately in sections)
      .replace(/^#{1,6}\s+(.+)$/gm, '') // Remove headers as they're handled in sections

      // Code blocks with enhanced styling
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'text';
        return `
        <div class="group relative my-8 overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100/50 shadow-lg">
          <div class="flex items-center justify-between bg-gray-900 px-6 py-3">
            <div class="flex items-center space-x-2">
              <div class="h-3 w-3 rounded-full bg-red-500"></div>
              <div class="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div class="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">${language}</span>
          </div>
          <pre class="overflow-x-auto p-6"><code class="text-sm font-mono text-gray-800 leading-relaxed">${escapeHtml(
            code.trim()
          )}</code></pre>
        </div>
      `;
      })

      // Inline code with pill styling
      .replace(/`([^`]+)`/g, (match, code) => {
        return `<code class="inline-flex items-center px-2 py-1 text-sm font-mono bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border border-blue-200 rounded-full shadow-sm">${escapeHtml(
          code
        )}</code>`;
      })

      // Enhanced blockquotes with icons
      .replace(/^> (.+)$/gm, (match, text) => {
        let icon = '💡'; // Default
        let bgColor = 'bg-blue-50';
        let borderColor = 'border-blue-400';
        let textColor = 'text-blue-800';

        if (
          text.toLowerCase().includes('warning') ||
          text.toLowerCase().includes('caution')
        ) {
          icon = '⚠️';
          bgColor = 'bg-yellow-50';
          borderColor = 'border-yellow-400';
          textColor = 'text-yellow-800';
        } else if (
          text.toLowerCase().includes('error') ||
          text.toLowerCase().includes('danger')
        ) {
          icon = '🚨';
          bgColor = 'bg-red-50';
          borderColor = 'border-red-400';
          textColor = 'text-red-800';
        } else if (
          text.toLowerCase().includes('tip') ||
          text.toLowerCase().includes('hint')
        ) {
          icon = '🎯';
          bgColor = 'bg-green-50';
          borderColor = 'border-green-400';
          textColor = 'text-green-800';
        }

        return `
        <blockquote class="my-6 ${bgColor} border-l-4 ${borderColor} rounded-r-lg p-4 shadow-sm">
          <div class="flex items-start space-x-3">
            <span class="text-2xl flex-shrink-0">${icon}</span>
            <p class="${textColor} font-medium leading-relaxed">${escapeHtml(
              text
            )}</p>
          </div>
        </blockquote>
      `;
      })

      // Enhanced links with hover effects
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
        const safeHref = sanitizeUrl(href);
        const safeLabel = escapeHtml(label);
        if (!safeHref) {
          return safeLabel;
        }
        return `<a href="${safeHref}" class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium underline decoration-blue-300 hover:decoration-blue-500 underline-offset-2 transition-all duration-200 hover:scale-105">${safeLabel}<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
      })

      // Lists with beautiful styling
      .replace(/^\* (.+)$/gm, (match, item) => {
        return `<li class="flex items-start space-x-3 py-2"><span class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span><span class="text-gray-700 leading-relaxed">${escapeHtml(
          item
        )}</span></li>`;
      })
      .replace(/^\d+\. (.+)$/gm, (match, item) => {
        return `<li class="flex items-start space-x-3 py-2"><span class="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center mt-0.5">•</span><span class="text-gray-700 leading-relaxed">${escapeHtml(
          item
        )}</span></li>`;
      })

      // Bold and italic with enhanced styling
      .replace(/\*\*([^\*]+)\*\*/g, (match, text) => {
        return `<strong class="font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${escapeHtml(
          text
        )}</strong>`;
      })
      .replace(/\*([^\*]+)\*/g, (match, text) => {
        return `<em class="italic text-gray-600 font-medium">${escapeHtml(
          text
        )}</em>`;
      })

      // Tables with advanced styling (basic implementation)
      .replace(/\|(.+)\|/g, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        return `<tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">${cells
          .map(
            (cell: string) =>
              `<td class="px-6 py-4 text-sm text-gray-700">${escapeHtml(
                cell
              )}</td>`
          )
          .join('')}</tr>`;
      })

      // Paragraphs with proper spacing
      .replace(
        /\n\n/g,
        '</p><p class="mb-6 text-gray-700 leading-relaxed text-lg">'
      )
      .replace(/\n/g, '<br class="my-2">')
  );
}

/**
 * Generate beautiful HTML documentation with advanced Tailwind styling and semantic structure
 */
function generateStyledHTML(content: string, projectName: string): string {
  const { sections, tableOfContents } = parseMarkdownToSections(
    content,
    projectName
  );

  // Generate navigation for table of contents
  const tocHTML = tableOfContents
    .map(item => {
      const indent = 'ml-' + (item.level - 1) * 4;
      return `
      <li class="${indent}">
        <a href="#${item.id}" class="block py-2 px-3 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border-l-2 border-transparent hover:border-blue-400">
          ${item.title}
        </a>
      </li>
    `;
    })
    .join('');

  // Generate sections with semantic HTML
  const sectionsHTML = sections
    .map(section => {
      const convertedContent = convertMarkdownToHTML(section.content);
      const wrappedContent = convertedContent
        ? `<div class="prose prose-lg max-w-none">${convertedContent}</div>`
        : '';

      // Section-specific styling based on type
      const getSectionIcon = (type: string) => {
        switch (type) {
          case 'overview':
            return '🏠';
          case 'installation':
            return '⚙️';
          case 'usage':
            return '🚀';
          case 'api':
            return '🔧';
          case 'examples':
            return '💡';
          case 'contributing':
            return '🤝';
          default:
            return '📋';
        }
      };

      const getSectionGradient = (type: string) => {
        switch (type) {
          case 'overview':
            return 'from-blue-500 to-purple-600';
          case 'installation':
            return 'from-green-500 to-teal-600';
          case 'usage':
            return 'from-orange-500 to-red-600';
          case 'api':
            return 'from-purple-500 to-pink-600';
          case 'examples':
            return 'from-yellow-500 to-orange-600';
          case 'contributing':
            return 'from-indigo-500 to-blue-600';
          default:
            return 'from-gray-500 to-gray-600';
        }
      };

      return `
      <section id="${section.id}" class="mb-16 scroll-mt-24" data-section-type="${section.type}">
        <div class="relative">
          <!-- Section header with gradient background -->
          <div class="bg-gradient-to-r ${getSectionGradient(section.type)} rounded-2xl p-8 mb-8 text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300">
            <div class="flex items-center space-x-4 mb-4">
              <span class="text-4xl">${getSectionIcon(section.type)}</span>
              <h${section.level} class="text-3xl font-bold">${section.title}</h${section.level}>
            </div>
            <div class="h-1 w-24 bg-white/30 rounded-full"></div>
          </div>
          
          <!-- Section content -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
            ${wrappedContent}
          </div>
        </div>
      </section>
    `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} Documentation</title>
    <meta name="description" content="Comprehensive documentation for ${projectName} - Generated with DocSkrive">
    <meta name="author" content="DocSkrive">
    
    <!-- Tailwind CSS with comprehensive configuration -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              primary: {
                50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
                400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
                800: '#1e40af', 900: '#1e3a8a', 950: '#172554'
              },
              gray: {
                50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
                400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
                800: '#1f2937', 900: '#111827', 950: '#030712'
              }
            },
            fontFamily: {
              'sans': ['Inter var', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
              'mono': ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
              'display': ['Cal Sans', 'Inter var', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
            },
            typography: {
              DEFAULT: {
                css: {
                  maxWidth: 'none',
                  color: '#374151',
                  lineHeight: '1.75',
                }
              }
            },
            animation: {
              'fade-in': 'fadeIn 0.5s ease-in-out',
              'slide-up': 'slideUp 0.6s ease-out',
              'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
              fadeIn: {
                '0%': { opacity: '0' },
                '100%': { opacity: '1' },
              },
              slideUp: {
                '0%': { transform: 'translateY(20px)', opacity: '0' },
                '100%': { transform: 'translateY(0)', opacity: '1' },
              }
            },
            backdropBlur: {
              xs: '2px',
            }
          }
        },
        plugins: [],
      }
    </script>
    
    <!-- Premium fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
    
    <!-- Custom styles for enhanced experience -->
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cal+Sans:wght@400;600;700&display=swap');
      
      /* Enhanced scrollbar styling */
      ::-webkit-scrollbar { width: 12px; height: 12px; }
      ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
      ::-webkit-scrollbar-thumb { 
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 8px;
        border: 2px solid #f1f5f9;
      }
      ::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, #2563eb, #7c3aed); }
      
      /* Smooth reveal animations */
      .animate-reveal { animation: slideUp 0.6s ease-out forwards; }
      .animate-reveal-delay { animation: slideUp 0.8s ease-out forwards; }
      
      /* Enhanced code block styling */
      .code-block { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); }
      
      /* Gradient text effects */
      .gradient-text {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      /* Enhanced shadows and glows */
      .glow-blue { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
      .glow-purple { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
      
      /* Print optimizations */
      @media print {
        .no-print { display: none !important; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .bg-gradient-to-r { background: #3b82f6 !important; }
        * { box-shadow: none !important; }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .auto-dark { background-color: #111827; color: #f9fafb; }
      }
      
      /* Loading shimmer effect */
      @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
      }
      .shimmer {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200px 100%;
        animation: shimmer 1.5s infinite;
      }
    </style>
</head>

<body class="bg-gradient-to-br from-slate-50 to-blue-50/50 font-sans antialiased min-h-screen">
  <!-- Enhanced Navigation with Glass Morphism -->
  <nav class="fixed top-0 w-full z-50 no-print backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Title -->
        <div class="flex items-center space-x-4">
          <div class="relative">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-300 glow-blue">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 class="text-xl font-bold gradient-text">${projectName}</h1>
            <p class="text-xs text-gray-500 font-medium">Documentation Portal</p>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center space-x-3">
          <button onclick="toggleTableOfContents()" class="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
            <span>Contents</span>
          </button>
          <button onclick="window.print()" class="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            <span>Export PDF</span>
          </button>
          <div class="text-xs text-gray-500 hidden sm:block">
            <div class="font-medium">${new Date().toLocaleDateString()}</div>
            <div>Generated</div>
          </div>
        </div>
      </div>
    </div>
  </nav>
  
  <!-- Table of Contents Sidebar -->
  <aside id="table-of-contents" class="fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 bg-white/90 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl transform -translate-x-full transition-transform duration-300 ease-in-out z-40 no-print overflow-y-auto">
    <div class="p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2M9 5a2 2 0 012 2v10a2 2 0 01-2 2M9 5a2 2 0 012-2h2a2 2 0 012 2M15 5h2a2 2 0 012 2v10a2 2 0 01-2 2h-2m-6-4h6m-6-4h6m-6-4h6"></path>
        </svg>
        Table of Contents
      </h3>
      <nav>
        <ul class="space-y-1">
          ${tocHTML}
        </ul>
      </nav>
    </div>
  </aside>
  
  <!-- Main Content Container -->
  <div class="pt-16 min-h-screen">
    <!-- Hero Section with Enhanced Design -->
    <header class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800"></div>
      <div class="absolute inset-0 bg-black/20"></div>
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%); background-size: 100px 100px;"></div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div class="text-center animate-fade-in">
          <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/80 text-sm font-medium mb-8">
            <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live Documentation</span>
          </div>
          
          <h1 class="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight">
            <span class="block">${projectName}</span>
            <span class="block text-3xl lg:text-4xl font-light text-blue-200 mt-2">Documentation</span>
          </h1>
          
          <p class="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Comprehensive, beautiful, and expertly crafted documentation generated with precision and care.
          </p>
          
          <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 text-blue-100">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="font-medium">Generated ${new Date().toLocaleDateString()}</span>
            </div>
            <div class="w-2 h-2 bg-blue-300 rounded-full hidden sm:block"></div>
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span class="font-medium">Powered by DocSkrive</span>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main Documentation Content -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div class="space-y-16 animate-reveal">
        ${sectionsHTML}
      </div>
    </main>
  </div>
  
  <!-- Enhanced Footer -->
  <footer class="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white">
    <div class="absolute inset-0 bg-black/50"></div>
    <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <span class="text-xl font-bold">DocSkrive</span>
          </div>
          <p class="text-gray-300 leading-relaxed">Professional documentation generation with AI-powered insights and beautiful design.</p>
        </div>
        
        <div>
          <h3 class="font-semibold text-lg mb-4">Documentation</h3>
          <ul class="space-y-2 text-gray-300">
            <li><a href="#overview" class="hover:text-white transition-colors">Overview</a></li>
            <li><a href="#installation" class="hover:text-white transition-colors">Installation</a></li>
            <li><a href="#usage" class="hover:text-white transition-colors">Usage Guide</a></li>
            <li><a href="#api" class="hover:text-white transition-colors">API Reference</a></li>
          </ul>
        </div>
        
        <div>
          <h3 class="font-semibold text-lg mb-4">Generated Info</h3>
          <div class="space-y-3 text-gray-300">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span class="text-sm">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="border-t border-gray-700 mt-12 pt-8 text-center">
        <p class="text-gray-400 text-sm">
          © ${new Date().getFullYear()} Generated with ❤️ by <span class="font-semibold text-white">DocSkrive</span>
        </p>
      </div>
    </div>
  </footer>
  
  <!-- Floating Action Buttons -->
  <div class="fixed bottom-6 right-6 flex flex-col space-y-3 no-print z-50">
    <!-- Back to Top -->
    <button onclick="scrollToTop()" id="back-to-top" class="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transform hover:scale-110 transition-all duration-300 flex items-center justify-center glow-blue">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    </button>
    
    <!-- Toggle Dark Mode -->
    <button onclick="toggleTheme()" class="w-12 h-12 bg-gray-800 hover:bg-gray-900 text-white rounded-full shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
      </svg>
    </button>
  </div>
  
  <!-- Enhanced JavaScript for Interactivity -->
  <script>
    // Smooth scroll to top
    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Toggle table of contents
    function toggleTableOfContents() {
      const toc = document.getElementById('table-of-contents');
      toc.classList.toggle('-translate-x-full');
    }
    
    // Close TOC when clicking outside
    document.addEventListener('click', function(e) {
      const toc = document.getElementById('table-of-contents');
      const tocButton = e.target.closest('button[onclick="toggleTableOfContents()"]');
      if (!toc.contains(e.target) && !tocButton) {
        toc.classList.add('-translate-x-full');
      }
    });
    
    // Theme toggle functionality
    function toggleTheme() {
      document.documentElement.classList.toggle('dark');
    }
    
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-reveal');
        }
      });
    }, observerOptions);
    
    // Observe all sections
    document.addEventListener('DOMContentLoaded', function() {
      const sections = document.querySelectorAll('section');
      sections.forEach(section => observer.observe(section));
      
      // Show back to top button on scroll
      const backToTopButton = document.getElementById('back-to-top');
      window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
          backToTopButton.style.display = 'flex';
        } else {
          backToTopButton.style.display = 'none';
        }
      });
      
      // Initially hide back to top button
      backToTopButton.style.display = 'none';
    });
    
    // Enhanced smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Close TOC on mobile after navigation
          document.getElementById('table-of-contents').classList.add('-translate-x-full');
        }
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Generate Notion-compatible markdown format
 */
function generateNotionFormat(content: string, projectName: string): string {
  // Convert to Notion-friendly markdown
  let notionContent = content
    // Notion uses different callout syntax
    .replace(/^> (.+)$/gm, '> 💡 $1')
    // Notion supports better table formatting
    .replace(/\|(.+)\|/g, (match, content) => {
      return match; // Keep table syntax as-is for Notion
    })
    // Add Notion-style dividers
    .replace(/^---$/gm, '---')
    // Notion-specific formatting for code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '```$1\n$2\n```');

  return `# ${projectName}\n\n📄 **Generated with DocSkrive** | ${new Date().toLocaleDateString()}\n\n---\n\n${notionContent}\n\n---\n\n> 🔗 This documentation was automatically generated. Last updated: ${new Date().toLocaleDateString()}`;
}

/**
 * Generate Confluence-compatible markup
 */
function generateConfluenceFormat(
  content: string,
  projectName: string
): string {
  // Convert markdown to Confluence markup
  let confluenceContent = content
    // Headers
    .replace(/^# (.+)$/gm, 'h1. $1')
    .replace(/^## (.+)$/gm, 'h2. $1')
    .replace(/^### (.+)$/gm, 'h3. $1')
    .replace(/^#### (.+)$/gm, 'h4. $1')
    // Bold and italic
    .replace(/\*\*([^\*]+)\*\*/g, '*$1*')
    .replace(/\*([^\*]+)\*/g, '_$1_')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '{code:$1}\n$2\n{code}')
    // Inline code
    .replace(/`([^`]+)`/g, '{{$1}}')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1|$2]')
    // Lists
    .replace(/^\* (.+)$/gm, '* $1')
    .replace(/^\d+\. (.+)$/gm, '# $1')
    // Tables (basic conversion)
    .replace(/\|(.+)\|/g, match => {
      return match.replace(/\|/g, '|');
    })
    // Blockquotes
    .replace(/^> (.+)$/gm, 'bq. $1')
    // Info panels
    .replace(/^> 💡 (.+)$/gm, '{info}$1{info}');

  return `h1. ${projectName}\n\n{panel:title=Generated Documentation|borderStyle=dashed|borderColor=#ccc|titleBGColor=#f7f7f7|bgColor=#ffffce}\nThis documentation was automatically generated with DocSkrive on ${new Date().toLocaleDateString()}.\n{panel}\n\n${confluenceContent}\n\n----\n\n{tip}Last updated: ${new Date().toLocaleDateString()}{tip}`;
}

/**
 * Split content into sections based on headers
 */
function splitContentIntoSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection = 'overview';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#+)\s+(.+)$/);
    if (headerMatch && headerMatch[1].length <= 2) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }

      // Start new section
      currentSection = headerMatch[2]
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-');
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Create a ZIP file using JSZip (client-side)
 */
async function createZipDownload(
  files: Array<{ name: string; content: string }>,
  zipName: string
) {
  // Dynamic import of JSZip for client-side
  const JSZip = (await import('jszip')).default;

  const zip = new JSZip();

  files.forEach(file => {
    zip.file(file.name, file.content);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return downloadFile(zipBlob, zipName, 'application/zip');
}

/**
 * Main download function - handles all formats and structures with enhanced HTML generation
 */
export async function downloadDocumentation(options: DownloadOptions) {
  const { content, format, structure, projectName, metadata } = options;

  try {
    if (format === 'markdown') {
      if (structure === 'single-file') {
        // Single markdown file
        return downloadFile(content, 'README.md', 'text/markdown');
      } else {
        // Multiple markdown files
        const sections = splitContentIntoSections(content);
        const files: Array<{ name: string; content: string }> = [];

        // Create main README
        files.push({
          name: 'README.md',
          content:
            sections['overview'] ||
            content.substring(0, 500) +
              '\n\n[See docs/ folder for detailed documentation]',
        });

        // Create docs folder files
        Object.entries(sections).forEach(([key, sectionContent]) => {
          if (key !== 'overview' && sectionContent) {
            files.push({
              name: `docs/${key}.md`,
              content: sectionContent,
            });
          }
        });

        return await createZipDownload(
          files,
          `${projectName.toLowerCase().replace(/\s+/g, '-')}-docs.zip`
        );
      }
    } else if (format === 'html') {
      const htmlContent = generateStyledHTML(content, projectName);

      if (structure === 'single-file') {
        // Single HTML file
        return downloadFile(htmlContent, 'index.html', 'text/html');
      } else {
        // Multiple HTML files
        const sections = splitContentIntoSections(content);
        const files: Array<{ name: string; content: string }> = [];

        // Create main index.html
        const indexContent = generateStyledHTML(
          sections['overview'] || content.substring(0, 1000),
          projectName
        );
        files.push({ name: 'index.html', content: indexContent });

        // Create section HTML files
        Object.entries(sections).forEach(([key, sectionContent]) => {
          if (key !== 'overview' && sectionContent) {
            const sectionHtml = generateStyledHTML(
              sectionContent,
              `${projectName} - ${key}`
            );
            files.push({
              name: `${key}.html`,
              content: sectionHtml,
            });
          }
        });

        return await createZipDownload(
          files,
          `${projectName.toLowerCase().replace(/\s+/g, '-')}-docs.zip`
        );
      }
    } else if (format === 'pdf') {
      // For PDF, we'll fall back to opening a print dialog with styled HTML
      const htmlContent = generateStyledHTML(content, projectName);

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Trigger print dialog after content loads
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 100);
        };

        return {
          filename: `${projectName}.pdf`,
          size: htmlContent.length,
          mimeType: 'application/pdf',
          note: 'PDF opened in new window - use browser print to save as PDF',
        };
      } else {
        throw new Error(
          'Could not open print window. Please allow popups and try again.'
        );
      }
    } else if (format === 'notion') {
      // Generate Notion-compatible markdown
      const notionContent = generateNotionFormat(content, projectName);

      if (structure === 'single-file') {
        return downloadFile(
          notionContent,
          `${projectName}-notion.md`,
          'text/markdown'
        );
      } else {
        const sections = splitContentIntoSections(content);
        const files: Array<{ name: string; content: string }> = [];

        // Create main page
        files.push({
          name: 'README.md',
          content: generateNotionFormat(
            sections['overview'] || content.substring(0, 500),
            projectName
          ),
        });

        // Create sub-pages
        Object.entries(sections).forEach(([key, sectionContent]) => {
          if (key !== 'overview' && sectionContent) {
            files.push({
              name: `${key}.md`,
              content: generateNotionFormat(
                sectionContent,
                `${projectName} - ${key}`
              ),
            });
          }
        });

        return await createZipDownload(
          files,
          `${projectName.toLowerCase().replace(/\s+/g, '-')}-notion.zip`
        );
      }
    } else if (format === 'confluence') {
      // Generate Confluence-compatible markup
      const confluenceContent = generateConfluenceFormat(content, projectName);

      if (structure === 'single-file') {
        return downloadFile(
          confluenceContent,
          `${projectName}-confluence.txt`,
          'text/plain'
        );
      } else {
        const sections = splitContentIntoSections(content);
        const files: Array<{ name: string; content: string }> = [];

        // Create main page
        files.push({
          name: 'main-page.txt',
          content: generateConfluenceFormat(
            sections['overview'] || content.substring(0, 500),
            projectName
          ),
        });

        // Create child pages
        Object.entries(sections).forEach(([key, sectionContent]) => {
          if (key !== 'overview' && sectionContent) {
            files.push({
              name: `${key}.txt`,
              content: generateConfluenceFormat(
                sectionContent,
                `${projectName} - ${key}`
              ),
            });
          }
        });

        return await createZipDownload(
          files,
          `${projectName.toLowerCase().replace(/\s+/g, '-')}-confluence.zip`
        );
      }
    }

    throw new Error(`Unsupported format: ${format}`);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

/**
 * Get appropriate file extension based on format and structure
 */
export function getDownloadInfo(
  format: string,
  structure: string,
  projectName: string
) {
  const sanitizedName = projectName.toLowerCase().replace(/\s+/g, '-');

  if (format === 'pdf') {
    return {
      filename: `${sanitizedName}.pdf`,
      mimeType: 'application/pdf',
      description: 'PDF Document (will open print dialog)',
    };
  }

  if (structure === 'single-file') {
    switch (format) {
      case 'markdown':
        return {
          filename: 'README.md',
          mimeType: 'text/markdown',
          description: 'Single Markdown file',
        };
      case 'html':
        return {
          filename: 'index.html',
          mimeType: 'text/html',
          description: 'Beautiful HTML documentation website with Tailwind CSS',
        };
      case 'notion':
        return {
          filename: `${sanitizedName}-notion.md`,
          mimeType: 'text/markdown',
          description: 'Notion-compatible Markdown file',
        };
      case 'confluence':
        return {
          filename: `${sanitizedName}-confluence.txt`,
          mimeType: 'text/plain',
          description: 'Confluence Wiki Markup file',
        };
      default:
        return {
          filename: `${sanitizedName}.txt`,
          mimeType: 'text/plain',
          description: 'Text file',
        };
    }
  } else {
    return {
      filename: `${sanitizedName}-${format}.zip`,
      mimeType: 'application/zip',
      description: `ZIP archive with multiple ${format.toUpperCase()} files${format === 'html' ? ' (Beautiful Tailwind CSS websites)' : ''}`,
    };
  }
}
