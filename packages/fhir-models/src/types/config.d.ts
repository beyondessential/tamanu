// Technically config has a @types package, but it doesn't work for us
// as we use the config default export directly as the resolved object.
declare module 'config' {
  const config: any;
  export default config;
}
