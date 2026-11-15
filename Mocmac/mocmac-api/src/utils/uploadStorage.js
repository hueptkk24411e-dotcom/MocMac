import { fileURLToPath } from 'node:url';

export const uploadsDirectory = fileURLToPath(new URL('../../storage/uploads/', import.meta.url));
