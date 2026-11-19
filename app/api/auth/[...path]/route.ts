import { readerAuth } from "@/lib/reader-auth/server";

export const { GET, POST, PUT, PATCH, DELETE } = readerAuth.handler();
