import { flattenError } from 'zod';

export function formatValidationError(zodError) {
  const { formErrors, fieldErrors } = flattenError(zodError);
  const details = { ...fieldErrors };

  if (formErrors.length > 0) {
    details.body = formErrors.map((message) =>
      message.includes('received undefined')
        ? 'Request body is required. Send JSON with Content-Type: application/json'
        : message,
    );
  }

  return {
    error: 'Validation failed',
    details,
  };
}
