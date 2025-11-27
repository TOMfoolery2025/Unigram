# Adding shadcn/ui Components

To add additional shadcn/ui components to the project, use the following command:

```bash
npx shadcn-ui@latest add [component-name]
```

## Commonly Used Components

Here are some components you'll likely need for this project:

```bash
# Forms and inputs
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add form

# Navigation
npx shadcn-ui@latest add navigation-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add breadcrumb

# Feedback
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert-dialog

# Display
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton

# Overlays
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add sheet

# Data display
npx shadcn-ui@latest add table
npx shadcn-ui@latest add accordion
```

## Example Usage

After adding a component, import and use it in your React components:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        Content goes here
      </CardContent>
    </Card>
  )
}
```

## Documentation

For full documentation and examples, visit: https://ui.shadcn.com/docs/components
