/**
 * Rich text renderer for Hygraph content
 * Provides custom renderers for various content elements
 */

import { RichText, RichTextProps } from '@graphcms/rich-text-react-renderer';
import { ElementNode } from '@graphcms/rich-text-types';
import Image from 'next/image';

interface RichTextRendererProps {
  content: any; // Rich text JSON from Hygraph
}

/**
 * Custom renderers for rich text elements
 * Ensures proper styling and Hygraph asset URL handling
 */
const renderers: RichTextProps['renderers'] = {
  // Heading renderers - responsive sizing
  h1: ({ children }) => (
    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 mt-6 md:mt-8 first:mt-0 break-words">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-5 mt-5 md:mt-7 break-words">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 md:mb-4 mt-4 md:mt-6 break-words">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base sm:text-lg md:text-xl font-bold mb-2 md:mb-3 mt-4 md:mt-5 break-words">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-base sm:text-lg font-bold mb-2 mt-3 md:mt-4 break-words">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-sm sm:text-base font-bold mb-2 mt-2 md:mt-3 break-words">{children}</h6>
  ),

  // Paragraph renderer - optimized line height for mobile
  p: ({ children }) => (
    <p className="mb-3 md:mb-4 leading-relaxed md:leading-7 break-words">{children}</p>
  ),

  // List renderers - responsive spacing
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-3 md:mb-4 space-y-1 md:space-y-2 ml-2 md:ml-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-3 md:mb-4 space-y-1 md:space-y-2 ml-2 md:ml-4">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed md:leading-7 break-words">{children}</li>
  ),

  // Link renderer - touch-friendly
  a: ({ children, href, openInNewTab, ...props }) => (
    <a
      href={href}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className="text-primary underline hover:text-primary/80 transition-colors break-words inline-block min-h-[44px] sm:min-h-0 flex items-center"
      {...props}
    >
      {children}
    </a>
  ),

  // Image renderer - responsive for mobile
  img: ({ src, title, width, height }: any) => {
    // For external images from Hygraph, we need to handle them carefully
    // If width and height are provided, use them; otherwise use a responsive container
    if (width && height) {
      return (
        <div className="relative my-4 md:my-6 -mx-4 md:mx-0" style={{ width: 'calc(100% + 2rem)', maxWidth: width }}>
          <Image
            src={src}
            alt={title || ''}
            title={title}
            width={width}
            height={height}
            className="rounded-none md:rounded-lg w-full h-auto"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      );
    }
    // Fallback for images without dimensions
    return (
      <div className="relative w-full my-4 md:my-6 -mx-4 md:mx-0" style={{ minHeight: '200px', width: 'calc(100% + 2rem)' }}>
        <Image
          src={src}
          alt={title || ''}
          title={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          className="rounded-none md:rounded-lg object-contain"
        />
      </div>
    );
  },

  // Code block renderer - mobile scrolling
  code_block: ({ children }) => (
    <pre className="bg-muted p-3 md:p-4 rounded-lg mb-3 md:mb-4 overflow-x-auto -mx-4 md:mx-0 text-xs md:text-sm">
      <code className="font-mono">{children}</code>
    </pre>
  ),

  // Inline code renderer
  code: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs md:text-sm font-mono break-words">
      {children}
    </code>
  ),

  // Blockquote renderer - responsive padding
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 md:border-l-4 border-primary pl-3 md:pl-4 italic my-3 md:my-4 text-muted-foreground break-words">
      {children}
    </blockquote>
  ),

  // Bold text
  bold: ({ children }) => (
    <strong className="font-bold">{children}</strong>
  ),

  // Italic text
  italic: ({ children }) => (
    <em className="italic">{children}</em>
  ),

  // Underline text
  underline: ({ children }) => (
    <u className="underline">{children}</u>
  ),
};

/**
 * RichTextRenderer component
 * Renders Hygraph rich text content with custom styling
 */
export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) {
    return (
      <p className="text-sm md:text-base text-muted-foreground italic">
        This article has no content yet.
      </p>
    );
  }

  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none overflow-hidden">
      <RichText content={content} renderers={renderers} />
    </div>
  );
}
