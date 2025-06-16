import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CodeSlideContent } from '../../types/slides';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Play } from 'lucide-react';

interface CodeSlideProps {
  content: CodeSlideContent;
}

export const CodeSlide: React.FC<CodeSlideProps> = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const customStyle = {
    ...oneLight,
    'pre[class*="language-"]': {
      ...oneLight['pre[class*="language-"]'],
      backgroundColor: '#f8f9fa',
      border: '1px solid #e1e4e8',
      borderRadius: '0.5rem',
      fontSize: '14px',
      lineHeight: '1.5',
    }
  };

  return (
    <div className="space-y-4">
      {content.explanation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-sm text-blue-800">{content.explanation}</p>
        </motion.div>
      )}

      <div className="relative">
        <div className="absolute top-2 right-2 flex space-x-2 z-10">
          {content.runnable && (
            <button
              className="px-3 py-1 bg-green-50 hover:bg-green-100 border border-green-300 rounded text-sm text-green-700 flex items-center space-x-1 transition-colors"
              aria-label="Run code"
            >
              <Play className="h-4 w-4" />
              <span>Run</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 flex items-center space-x-1 transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <SyntaxHighlighter
          language={content.language}
          style={customStyle}
          showLineNumbers
          wrapLines
          lineProps={(lineNumber) => {
            const style: React.CSSProperties = { display: 'block', width: '100%' };
            if (content.highlightLines?.includes(lineNumber)) {
              style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
              style.borderLeft = '3px solid #2563eb';
              style.paddingLeft = '12px';
            }
            return { style };
          }}
        >
          {content.code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};