export function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : typeof error === `string`
    ? error
    : `unknown error`;
}
