import { z } from 'zod';
import { WireframeScreen } from '@/types/wireframe';

export const ElementTypeEnum = z.enum([
  'header',
  'navbar',
  'sidebar',
  'button',
  'input',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'toggle',
  'table',
  'list',
  'card',
  'image',
  'chart',
  'modal',
  'tabs',
  'breadcrumb',
  'footer',
  'text',
  'icon'
]);

export const DeviceTypeEnum = z.enum(['mobile', 'tablet', 'desktop']);
export const LayoutTypeEnum = z.enum(['stack', 'grid', 'sidebar', 'tabs']);

// Lazy evaluation for recursive element children
export const WireframeElementSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1, 'Element id is required'),
    type: ElementTypeEnum,
    label: z.string().default(''),
    x: z.number().default(0),
    y: z.number().default(0),
    width: z.number().min(10, 'Width must be at least 10px').default(100),
    height: z.number().min(10, 'Height must be at least 10px').default(40),
    children: z.array(WireframeElementSchema).optional().default([]),
    navigatesTo: z.string().nullable().optional().default(null),
    notes: z.string().optional().default('')
  })
);

export const WireframeScreenSpecSchema = z.object({
  screenId: z.string().min(1, 'screenId is required'),
  name: z.string().min(1, 'name is required'),
  device: DeviceTypeEnum,
  layout: LayoutTypeEnum,
  elements: z.array(WireframeElementSchema).min(1, 'Screen must contain at least one element'),
  purpose: z.string().optional(),
  primaryRole: z.string().optional()
});

export type ValidatedScreenSpec = z.infer<typeof WireframeScreenSpecSchema>;

export interface ValidationResult {
  success: boolean;
  data?: WireframeScreen;
  errors?: string[];
  rawError?: string;
}

export function validateWireframeSpec(jsonInput: unknown): ValidationResult {
  try {
    let parsedJson = jsonInput;
    if (typeof jsonInput === 'string') {
      try {
        parsedJson = JSON.parse(jsonInput);
      } catch (err: any) {
        return {
          success: false,
          errors: [`Invalid JSON string: ${err.message}`],
          rawError: err.message
        };
      }
    }

    const result = WireframeScreenSpecSchema.safeParse(parsedJson);

    if (!result.success) {
      const formattedErrors = result.error.issues.map(
        (issue) => `Field [${issue.path.join('.')}]: ${issue.message}`
      );
      return {
        success: false,
        errors: formattedErrors,
        rawError: JSON.stringify(result.error.format(), null, 2)
      };
    }

    return {
      success: true,
      data: result.data as WireframeScreen
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [error?.message || 'Unknown validation failure'],
      rawError: String(error)
    };
  }
}
