import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ContextStore } from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import rehypeSanitize from 'rehype-sanitize'; //preventing xss
import { useTheme } from '../components/ThemeProvider'; // Import the theme hook

interface MarkdownProps {
  initialData: { content: string };
  isTranslationPage: boolean;
}

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

type OnChange = (
  value?: string,
  event?: React.ChangeEvent<HTMLTextAreaElement>,
  state?: ContextStore
) => void;

// Custom CSS to make MD Editor respond to theme colors
const customMarkdownStyles = `
  .w-md-editor {
    color: var(--foreground);
    background-color: var(--background);
    border-color: var(--border);
  }
  .w-md-editor-text {
    color: var(--foreground);
    background-color: var(--background);
  }
  .w-md-editor-toolbar {
    background-color: var(--muted);
    border-color: var(--border);
  }
  .w-md-editor-toolbar-divider {
    background-color: var(--border);
  }
  .w-md-editor-toolbar-item button {
    color: var(--foreground);
  }
  .w-md-editor-toolbar-item button:hover {
    color: var(--primary);
  }
  .w-md-editor-content {
    border-color: var(--border);
  }
  .wmde-markdown {
    background-color: var(--background);
    color: var(--foreground);
  }
  .wmde-markdown-color {
    background-color: var(--background);
    color: var(--foreground);
  }
  .wmde-markdown-var {
    color: var(--primary);
  }
  .wmde-markdown h1,
  .wmde-markdown h2,
  .wmde-markdown h3,
  .wmde-markdown h4,
  .wmde-markdown h5,
  .wmde-markdown h6 {
    color: var(--foreground);
    border-color: var(--border);
  }
  .wmde-markdown h1 .anchor svg,
  .wmde-markdown h2 .anchor svg,
  .wmde-markdown h3 .anchor svg,
  .wmde-markdown h4 .anchor svg,
  .wmde-markdown h5 .anchor svg,
  .wmde-markdown h6 .anchor svg {
    color: var(--muted-foreground);
  }
  .wmde-markdown code {
    background-color: var(--muted);
    color: var(--foreground);
  }
  .wmde-markdown pre {
    background-color: var(--card);
    border-color: var(--border);
  }
  .wmde-markdown blockquote {
    border-color: var(--border);
    color: var(--muted-foreground);
  }
  .wmde-markdown-color a {
    color: var(--primary);
  }
  .wmde-markdown hr {
    background-color: var(--border);
  }
  .wmde-markdown table tr {
    background-color: var(--background);
    border-color: var(--border);
  }
  .wmde-markdown table tr:nth-child(2n) {
    background-color: var(--muted);
  }
  .wmde-markdown table th,
  .wmde-markdown table td {
    border-color: var(--border);
  }
`;

export default function MarkdownEditor({
  initialData,
  isTranslationPage,
}: MarkdownProps) {
  const [value, setValue] = React.useState(initialData?.content);
  const { isDarkMode } = useTheme(); // Get dark mode state from theme context

  const onChange = React.useCallback<OnChange>(val => {
    setValue(val || '');
  }, []);

  React.useEffect(() => {
    setValue(initialData?.content);
  }, [initialData?.content]);

  // Inject custom styles to make the markdown editor use theme colors
  useEffect(() => {
    // Create a style element for our custom markdown styles
    const styleElement = document.createElement('style');
    styleElement.textContent = customMarkdownStyles;
    styleElement.id = 'custom-markdown-styles';

    // Remove existing style if it exists
    const existingStyle = document.getElementById('custom-markdown-styles');
    if (existingStyle && existingStyle.parentNode) {
      existingStyle.parentNode.removeChild(existingStyle);
    }

    // Add the style element to the head
    document.head.appendChild(styleElement);

    return () => {
      // Clean up when component unmounts
      const styleToRemove = document.getElementById('custom-markdown-styles');
      if (styleToRemove && styleToRemove.parentNode) {
        styleToRemove.parentNode.removeChild(styleToRemove);
      }
    };
  }, []);

  return (
    <div data-color-mode="dark">
      <MDEditor
        height={isTranslationPage ? 500 : 650}
        value={value}
        preview={isTranslationPage ? 'preview' : 'live'}
        onChange={onChange}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
      />
    </div>
  );
}
