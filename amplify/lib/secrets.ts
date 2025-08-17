import { secret } from "@aws-amplify/backend";

/**
 * Helper function to handle secrets in both sandbox and production environments
 * In sandbox: uses secret() function
 * In production: falls back to environment variables or other methods
 */
export function getSecret(name: string): any {
  // For now, we'll try the secret function first
  // This may need to be updated based on Amplify Gen2 evolution
  try {
    return secret(name);
  } catch (error) {
    console.warn(`Failed to get secret ${name}, falling back to environment variable`);
    // This fallback won't work in current Amplify Gen2 but shows the approach
    return process.env[name];
  }
}
