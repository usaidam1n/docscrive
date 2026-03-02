import React, { useState } from 'react';
import {
  Download,
  Mail,
  Copy,
  Check,
  FileText,
  Eye,
  Code2,
} from 'lucide-react';
import { EmailShareButton } from 'react-share';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface GeneratedDocumentProps {
  isTranslationPage: boolean;
  content: string | null;
  children: React.ReactNode;
}

const GeneratedDocument: React.FC<GeneratedDocumentProps> = ({
  isTranslationPage,
  content,
  children,
}) => {
  const [copied, setCopied] = useState(false);

  function handleDownloadClick() {
    if (content) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'README.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {!isTranslationPage && (
        <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2.5">
          <div className="flex items-center gap-3">
            {/* Traffic lights (mirroring input panel) */}
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
            </div>
            <div className="h-3.5 w-px bg-white/[0.06]" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Output
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Copy */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!content}
              className="h-7 gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-zinc-500 transition-all hover:bg-white/[0.05] hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-[#2ecc71]" />
                  <span className="text-[#2ecc71]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>

            <div className="mx-1 h-3.5 w-px bg-white/[0.06]" />

            {/* Download */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadClick}
              disabled={!content}
              className="h-7 w-7 rounded-lg p-0 text-zinc-500 transition-all hover:bg-white/[0.05] hover:text-white"
              title="Download as .md"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>

            {/* Email */}
            <EmailShareButton
              url={''}
              subject="Check out this documentation!"
              body={content ? content : ''}
              disabled={!content}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg p-0 text-sm font-medium text-zinc-500 transition-all hover:bg-white/[0.05] hover:text-white disabled:pointer-events-none disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
            </EmailShareButton>
          </div>
        </div>
      )}

      <div
        className={cn(
          'workspace-scrollbar flex-1 overflow-auto font-sans',
          isTranslationPage ? 'p-0' : 'p-4'
        )}
      >
        <div className="relative h-full w-full p-2">{children}</div>
      </div>
    </div>
  );
};

export default GeneratedDocument;
