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
  // Heading renderers
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold mb-6 mt-8 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-bold mb-5 mt-7">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-bold mb-4 mt-6">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-xl font-bold mb-3 mt-5">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-lg font-bold mb-2 mt-4">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-base font-bold mb-2 mt-3">{children}</h6>
  ),

  // Paragraph renderer
  p: ({ children }) => (
    <p className="mb-4 leading-7">{children}</p>
  ),

  // List renderers
  ul: ({ children }) => (
    <ul className="list-disc list-inside mb-4 space-y-2 ml-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-7">{children}</li>
  ),

  // Link renderer
  a: ({ children, href, openInNewTab, ...props }) => (
    <a
      href={href}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className="text-primary underline hover:text-primary/80 transition-colors"
      {...props}
    >
      {children}
    </a>
  ),

  // Image renderer - ensures Hygraph asset URLs are used
  img: ({ src, title, width, height }: any) => {
    // For external images from Hygraph, we need to handle them carefully
    // If width and height are provided, use them; otherwise use a responsive container
    if (width && height) {
      return (
        <div className="relative my-6" style={{ width: '100%', maxWidth: width }}>
          <Image
            src={src}
            alt={title || ''}
            title={title}
            width={width}
            height={height}
            className="rounded-lg"
            style={{ width: '100%', height: 'auto' }}
          />
        </div>
      );
    }
    // Fallback for images without dimensions
    return (
      <div className="relative w-full my-6" style={{ minHeight: '200px' }}>
        <Image
          src={src}
          alt={title || ''}
          title={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          className="rounded-lg object-contain"
        />
      </div>
    );
  },

  // Code block renderer
  code_block: ({ children }) => (
    <pre className="bg-muted p-4 rounded-lg mb-4 overflow-x-auto">
      <code className="text-sm font-mono">{children}</code>
    </pre>
  ),

  // Inline code renderer
  code: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),

  // Blockquote renderer
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
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
      <p className="text-muted-foreground italic">
        This article has no content yet.
      </p>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <RichText content={content} renderers={renderers} />
    </div>
  );
}
