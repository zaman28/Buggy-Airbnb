export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/favorites", "/properties", "/trips"],
};
