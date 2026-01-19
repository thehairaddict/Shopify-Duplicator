// Debug environment variables
console.log('=== Environment Variables Debug ===');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('PROD:', import.meta.env.PROD);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);

// Export for easy access
export const envDebug = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
  NODE_ENV: import.meta.env.NODE_ENV,
};
