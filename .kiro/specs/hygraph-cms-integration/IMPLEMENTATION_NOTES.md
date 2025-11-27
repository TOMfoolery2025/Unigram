# Implementation Notes

## Content Field Type: Markdown

**Important:** The `content` field in Hygraph is configured as **Markdown** type, not Rich Text.

### Implications for Implementation

1. **Rendering Library**
   - We'll need a Markdown renderer instead of the Rich Text renderer
   - Consider using: `react-markdown` or `marked` + `DOMPurify` for sanitization
   - The `@graphcms/rich-text-react-renderer` package may not be needed

2. **GraphQL Query**
   - Query the markdown field as a string:
   ```graphql
   query GetArticle($slug: String!) {
     wikiArticle(where: { slug: $slug }) {
       id
       title
       slug
       category
       content {
         markdown
       }
     }
   }
   ```

3. **Data Type**
   - Update TypeScript types to reflect Markdown content:
   ```typescript
   export interface HygraphWikiArticle {
     id: string;
     title: string;
     slug: string;
     category: string;
     content: {
       markdown: string;
     };
     // ...
   }
   ```

4. **Rendering Approach**
   - Parse and render Markdown to HTML
   - Apply proper styling with Tailwind classes
   - Sanitize HTML output to prevent XSS attacks
   - Handle images with proper asset URLs from Hygraph

### Next Steps

When implementing task 2 (GraphQL client) and task 6 (WikiArticle component), ensure:
- GraphQL queries request `content { markdown }` field
- Component uses a Markdown renderer (not Rich Text renderer)
- Proper sanitization is applied to rendered HTML
- Images and links are handled correctly
