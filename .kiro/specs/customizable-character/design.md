# Design Document: Customizable Character System

## Overview

The customizable character system enables users to create personalized avatar representations through an interactive character editor. The system provides a component-based approach where users select from predefined options across multiple customization categories (body type, face, hair, clothing, accessories, colors). Character data is stored as JSON in the user profile and rendered as SVG-based avatars throughout the platform.

The design leverages a declarative character definition format that maps user selections to visual components, enabling efficient rendering and storage. The system integrates with the existing profile infrastructure and replaces the current DiceBear avatar system with a more customizable solution.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │ Character Editor │         │  Character Avatar       │  │
│  │   Component      │         │    Component            │  │
│  └──────────────────┘         └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │ Character        │         │  Character Renderer     │  │
│  │ Validation       │         │  (SVG Generator)        │  │
│  └──────────────────┘         └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │ Character Data   │         │  Profile Database       │  │
│  │ Serialization    │         │  (Supabase)             │  │
│  └──────────────────┘         └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

1. **Character Editor Component**: Interactive UI for selecting customization options
2. **Character Avatar Component**: Renders character at various sizes throughout the platform
3. **Character Renderer**: Generates SVG representation from character data
4. **Character Validation**: Ensures character data integrity and applies defaults
5. **Character Data Serialization**: Converts between character objects and JSON storage format

## Components and Interfaces

### Character Data Model

```typescript
interface CharacterData {
  version: number; // Schema version for future migrations
  bodyType: BodyTypeId;
  face: {
    shape: FaceShapeId;
    eyes: EyesId;
    nose: NoseId;
    mouth: MouthId;
  };
  hair: {
    style: HairStyleId;
    color: ColorId;
  };
  skinTone: ColorId;
  clothing: {
    top: ClothingTopId;
    topColor: ColorId;
  };
  accessories: {
    glasses?: GlassesId;
    hat?: HatId;
  };
}

type BodyTypeId = 'slim' | 'average' | 'athletic' | 'broad';
type FaceShapeId = 'oval' | 'round' | 'square' | 'heart';
type EyesId = 'round' | 'almond' | 'wide' | 'narrow';
type NoseId = 'small' | 'medium' | 'large' | 'button';
type MouthId = 'smile' | 'neutral' | 'grin' | 'smirk';
type HairStyleId = 'short' | 'medium' | 'long' | 'curly' | 'bald' | 'ponytail';
type ClothingTopId = 'tshirt' | 'hoodie' | 'sweater' | 'jacket' | 'polo';
type GlassesId = 'none' | 'round' | 'square' | 'aviator';
type HatId = 'none' | 'cap' | 'beanie' | 'fedora';
type ColorId = string; // Hex color code
```

### Character Editor Interface

```typescript
interface CharacterEditorProps {
  userId: string;
  initialCharacter?: CharacterData | null;
  onSave: (character: CharacterData) => Promise<void>;
  onCancel: () => void;
}

interface CharacterEditorState {
  character: CharacterData;
  isDirty: boolean;
  isSaving: boolean;
  activeCategory: CustomizationCategory;
}

type CustomizationCategory = 
  | 'body' 
  | 'face' 
  | 'hair' 
  | 'clothing' 
  | 'accessories';
```

### Character Avatar Interface

```typescript
interface CharacterAvatarProps {
  character: CharacterData | null;
  size: 'sm' | 'md' | 'lg'; // 40px, 80px, 200px
  className?: string;
  fallbackSeed?: string; // For default avatar generation
}
```

### Character Service Interface

```typescript
interface CharacterService {
  // Validation
  validateCharacterData(data: unknown): CharacterData;
  getDefaultCharacter(): CharacterData;
  
  // Serialization
  serializeCharacter(character: CharacterData): string;
  deserializeCharacter(json: string): CharacterData;
  
  // Rendering
  renderCharacterSVG(character: CharacterData, size: number): string;
  
  // Storage
  saveCharacter(userId: string, character: CharacterData): Promise<void>;
  loadCharacter(userId: string): Promise<CharacterData | null>;
}
```

## Data Models

### Database Schema Changes

Add a `character_data` column to the existing `user_profiles` table:

```sql
ALTER TABLE public.user_profiles 
ADD COLUMN character_data JSONB DEFAULT NULL;

-- Index for efficient querying
CREATE INDEX idx_user_profiles_character_data 
ON public.user_profiles USING GIN (character_data);
```

### Character Data Storage Format

Character data is stored as JSONB in PostgreSQL, allowing for:
- Efficient querying and indexing
- Schema flexibility for future enhancements
- Compact storage (estimated 500-1000 bytes per character)

Example stored JSON:
```json
{
  "version": 1,
  "bodyType": "average",
  "face": {
    "shape": "oval",
    "eyes": "almond",
    "nose": "medium",
    "mouth": "smile"
  },
  "hair": {
    "style": "medium",
    "color": "#4A3728"
  },
  "skinTone": "#F5D7B1",
  "clothing": {
    "top": "hoodie",
    "topColor": "#3B82F6"
  },
  "accessories": {
    "glasses": "none",
    "hat": "none"
  }
}
```

### Color Palettes

Predefined color palettes ensure visual consistency and accessibility:

```typescript
const COLOR_PALETTES = {
  hair: [
    '#1C1C1C', // Black
    '#4A3728', // Dark Brown
    '#8B5A3C', // Brown
    '#D4A574', // Light Brown
    '#E6C7A3', // Blonde
    '#C84B31', // Red
    '#9B59B6', // Purple
    '#3498DB', // Blue
  ],
  skin: [
    '#FFDFC4', // Very Light
    '#F5D7B1', // Light
    '#E8B98A', // Medium Light
    '#D4A574', // Medium
    '#C68642', // Medium Dark
    '#8D5524', // Dark
    '#6B4423', // Very Dark
    '#4A2F1F', // Deep
  ],
  clothing: [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Orange
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
    '#1F2937', // Dark Gray
  ],
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several redundancies were identified:
- Criteria 3.4 and 4.2 are redundant with 1.2 (preview updates on any change)
- Criteria 4.3 is redundant with 7.3 (preview display after operations)
- Criteria 6.1 is redundant with 1.4 (character display on profile)

These have been consolidated into comprehensive properties that provide unique validation value.

### Properties

**Property 1: Real-time preview updates**
*For any* valid customization change (body type, facial feature, hair, clothing, accessory, or color), applying the change should update the character preview to reflect the new selection.
**Validates: Requirements 1.2, 3.4, 4.2**

**Property 2: Character persistence round-trip**
*For any* valid character data, serializing and then deserializing the character should produce an equivalent character with all customization options preserved.
**Validates: Requirements 5.3, 5.4**

**Property 3: Character data persistence**
*For any* valid character configuration, saving the character should result in the character data being stored in the database and retrievable for the same user.
**Validates: Requirements 1.3, 5.2**

**Property 4: Body type rendering consistency**
*For any* body type selection, the rendered character SVG should contain the corresponding body type identifier and visual elements.
**Validates: Requirements 2.2**

**Property 5: Facial features rendering consistency**
*For any* combination of eyes, nose, and mouth selections, the rendered character should include all three selected facial features.
**Validates: Requirements 2.3**

**Property 6: Hair style and color rendering**
*For any* hair style and color combination, the rendered character should display the selected hair style with the selected color applied.
**Validates: Requirements 2.4**

**Property 7: Clothing and color rendering**
*For any* clothing selection and color combination, the rendered character should display the selected clothing item with the selected color applied.
**Validates: Requirements 2.5**

**Property 8: Color application consistency**
*For any* color selection on any customizable element (hair, skin, clothing, accessories), applying the color should update the character data and rendered output to use that color.
**Validates: Requirements 3.2**

**Property 9: Serialization format compliance**
*For any* valid character data, the serialized JSON should contain only option identifiers (not asset data) and be under 10 kilobytes in size.
**Validates: Requirements 8.1, 8.2**

**Property 10: Character data validation**
*For any* data structure, the validation function should accept valid character data and reject invalid data before database persistence.
**Validates: Requirements 8.3**

**Property 11: Reset to defaults**
*For any* character state, applying the reset operation should restore all customization options to their default values.
**Validates: Requirements 7.2**

## Error Handling

### Validation Errors

The system handles validation errors at multiple levels:

1. **Client-Side Validation**
   - Prevent invalid selections through UI constraints
   - Validate character data structure before save
   - Display user-friendly error messages

2. **Server-Side Validation**
   - Validate character data schema on save
   - Enforce size limits (10KB max)
   - Reject malformed JSON

3. **Deserialization Errors**
   - Handle corrupted character data gracefully
   - Apply default values for missing fields
   - Log errors for monitoring
   - Display default character to user

### Error Recovery Strategies

```typescript
// Graceful degradation for character loading
async function loadCharacterWithFallback(userId: string): Promise<CharacterData> {
  try {
    const data = await loadCharacter(userId);
    if (!data) {
      return getDefaultCharacter();
    }
    return validateCharacterData(data);
  } catch (error) {
    logger.error('Failed to load character', { userId, error });
    return getDefaultCharacter();
  }
}

// Validation with default fallbacks
function validateCharacterData(data: unknown): CharacterData {
  const defaults = getDefaultCharacter();
  
  if (!isObject(data)) {
    return defaults;
  }
  
  return {
    version: data.version ?? defaults.version,
    bodyType: isValidBodyType(data.bodyType) ? data.bodyType : defaults.bodyType,
    face: {
      shape: isValidFaceShape(data.face?.shape) ? data.face.shape : defaults.face.shape,
      eyes: isValidEyes(data.face?.eyes) ? data.face.eyes : defaults.face.eyes,
      nose: isValidNose(data.face?.nose) ? data.face.nose : defaults.face.nose,
      mouth: isValidMouth(data.face?.mouth) ? data.face.mouth : defaults.face.mouth,
    },
    // ... continue for all fields
  };
}
```

### Error Messages

User-facing error messages should be clear and actionable:

- **Save Failed**: "Unable to save your character. Please try again."
- **Load Failed**: "Unable to load your character. Showing default character."
- **Invalid Data**: "Character data is invalid. Resetting to defaults."
- **Network Error**: "Connection error. Your changes may not be saved."

## Testing Strategy

### Unit Testing

Unit tests verify specific functionality and edge cases:

1. **Serialization/Deserialization**
   - Test valid character data serialization
   - Test deserialization with missing fields
   - Test deserialization with invalid values
   - Test size limits enforcement

2. **Validation**
   - Test validation accepts valid data
   - Test validation rejects invalid body types
   - Test validation rejects invalid colors
   - Test validation handles null/undefined

3. **Default Character**
   - Test default character has all required fields
   - Test default character passes validation
   - Test default character renders successfully

4. **Color Palettes**
   - Test all color palettes have minimum 8 colors
   - Test color values are valid hex codes
   - Test color application to character data

5. **SVG Rendering**
   - Test rendering at different sizes (40px, 80px, 200px)
   - Test SVG output is valid XML
   - Test SVG contains expected elements

### Property-Based Testing

Property-based tests verify universal properties across many randomly generated inputs using **fast-check** (JavaScript/TypeScript property-based testing library).

Each property-based test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

1. **Property 1: Real-time preview updates**
   - Generate random customization changes
   - Verify preview updates after each change
   - **Feature: customizable-character, Property 1: Real-time preview updates**

2. **Property 2: Character persistence round-trip**
   - Generate random valid character data
   - Serialize then deserialize
   - Verify result equals original
   - **Feature: customizable-character, Property 2: Character persistence round-trip**

3. **Property 3: Character data persistence**
   - Generate random character configurations
   - Save to database
   - Load from database
   - Verify data matches
   - **Feature: customizable-character, Property 3: Character data persistence**

4. **Property 4: Body type rendering consistency**
   - Generate random body type selections
   - Render character
   - Verify SVG contains body type identifier
   - **Feature: customizable-character, Property 4: Body type rendering consistency**

5. **Property 5: Facial features rendering consistency**
   - Generate random facial feature combinations
   - Render character
   - Verify all features present in SVG
   - **Feature: customizable-character, Property 5: Facial features rendering consistency**

6. **Property 6: Hair style and color rendering**
   - Generate random hair style and color combinations
   - Render character
   - Verify hair style and color in SVG
   - **Feature: customizable-character, Property 6: Hair style and color rendering**

7. **Property 7: Clothing and color rendering**
   - Generate random clothing and color combinations
   - Render character
   - Verify clothing and color in SVG
   - **Feature: customizable-character, Property 7: Clothing and color rendering**

8. **Property 8: Color application consistency**
   - Generate random color changes on random elements
   - Apply color
   - Verify character data and render updated
   - **Feature: customizable-character, Property 8: Color application consistency**

9. **Property 9: Serialization format compliance**
   - Generate random valid character data
   - Serialize to JSON
   - Verify size under 10KB
   - Verify contains only identifiers
   - **Feature: customizable-character, Property 9: Serialization format compliance**

10. **Property 10: Character data validation**
    - Generate random valid and invalid data structures
    - Run validation
    - Verify valid data accepted, invalid rejected
    - **Feature: customizable-character, Property 10: Character data validation**

11. **Property 11: Reset to defaults**
    - Generate random character states
    - Apply reset
    - Verify all fields match defaults
    - **Feature: customizable-character, Property 11: Reset to defaults**

### Integration Testing

Integration tests verify the system works correctly with external dependencies:

1. **Database Integration**
   - Test saving character to Supabase
   - Test loading character from Supabase
   - Test updating existing character
   - Test handling missing character data

2. **Profile Integration**
   - Test character display on profile page
   - Test character display in post cards
   - Test character display in search results
   - Test fallback to default when no character exists

3. **Avatar Component Integration**
   - Test CharacterAvatar renders at all sizes
   - Test CharacterAvatar handles null character data
   - Test CharacterAvatar updates when character changes

### Test Data Generators

For property-based testing, we need generators for random character data:

```typescript
// fast-check arbitraries for character data
const bodyTypeArb = fc.constantFrom('slim', 'average', 'athletic', 'broad');
const faceShapeArb = fc.constantFrom('oval', 'round', 'square', 'heart');
const eyesArb = fc.constantFrom('round', 'almond', 'wide', 'narrow');
const noseArb = fc.constantFrom('small', 'medium', 'large', 'button');
const mouthArb = fc.constantFrom('smile', 'neutral', 'grin', 'smirk');
const hairStyleArb = fc.constantFrom('short', 'medium', 'long', 'curly', 'bald', 'ponytail');
const clothingTopArb = fc.constantFrom('tshirt', 'hoodie', 'sweater', 'jacket', 'polo');
const glassesArb = fc.constantFrom('none', 'round', 'square', 'aviator');
const hatArb = fc.constantFrom('none', 'cap', 'beanie', 'fedora');
const colorArb = fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`);

const characterDataArb = fc.record({
  version: fc.constant(1),
  bodyType: bodyTypeArb,
  face: fc.record({
    shape: faceShapeArb,
    eyes: eyesArb,
    nose: noseArb,
    mouth: mouthArb,
  }),
  hair: fc.record({
    style: hairStyleArb,
    color: colorArb,
  }),
  skinTone: colorArb,
  clothing: fc.record({
    top: clothingTopArb,
    topColor: colorArb,
  }),
  accessories: fc.record({
    glasses: glassesArb,
    hat: hatArb,
  }),
});
```

## Implementation Notes

### SVG Generation Strategy

The character renderer generates SVG by composing predefined SVG elements:

1. **Component Library**: Store SVG paths for each customization option
2. **Composition**: Combine selected components into a single SVG
3. **Styling**: Apply colors through SVG fill and stroke attributes
4. **Optimization**: Minimize SVG size through path simplification

### Performance Considerations

1. **Memoization**: Cache rendered SVGs to avoid redundant generation
2. **Lazy Loading**: Load character editor components on demand
3. **Debouncing**: Debounce preview updates during rapid changes
4. **Compression**: Use SVGO to optimize generated SVGs

### Migration Strategy

To transition from DiceBear avatars to custom characters:

1. **Backward Compatibility**: Continue supporting avatar_url for users without characters
2. **Gradual Rollout**: Allow users to opt-in to character creation
3. **Fallback Logic**: Display avatar_url if character_data is null
4. **Data Migration**: Provide tool to convert existing avatars to default characters

### Accessibility Considerations

1. **ARIA Labels**: Add descriptive labels to all interactive elements
2. **Keyboard Navigation**: Support tab navigation through customization options
3. **Screen Reader Support**: Announce preview updates to screen readers
4. **Color Contrast**: Ensure color combinations meet WCAG AA standards
5. **Focus Indicators**: Provide clear visual focus indicators

## Future Enhancements

Potential future improvements to the character system:

1. **Animation**: Add simple animations to character avatars
2. **Expressions**: Allow users to select different facial expressions
3. **Poses**: Provide multiple pose options for characters
4. **Backgrounds**: Add customizable background options
5. **Import/Export**: Allow users to share character configurations
6. **Randomize**: Add "randomize" button for quick character generation
7. **Unlockables**: Introduce achievement-based customization options
8. **Seasonal Items**: Add limited-time seasonal accessories
