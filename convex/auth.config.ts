export default {
  providers: [
    {
      domain: process.env.VITE_AUTH0_DOMAIN || "",
      applicationID: process.env.VITE_AUTH0_CLIENT_ID || "",
    },
  ],
};
