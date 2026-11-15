import { readFileSync } from 'node:fs';

const sources = JSON.parse(readFileSync(new URL('../../data/product-image-sources.json', import.meta.url), 'utf8'));
const archive = JSON.parse(readFileSync(new URL('../../data/legacy-product-images.json', import.meta.url), 'utf8'));
const catalog = sources.flatMap(({ images }) => images);
const hostedUploads = new Map([
  ...archive.files.map(filename => ['/uploads/' + filename, new URL(filename, archive.baseUrl).href]),
  ...catalog.map(({ path, source }) => [path, source]),
  ...catalog.filter(({ previousSource }) => previousSource).map(({ previousSource, source }) => [previousSource, source]),
]);
const referenceUrls = new Set(
  catalog.filter(({ path }) => path.startsWith('/uploads/catalog-reference/')).map(({ source }) => source),
);
const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
const localUploadHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
for (const base of [process.env.BACKEND_URL, process.env.UPLOAD_SERVER_URL]) {
  if (!base) continue;
  try { localUploadHosts.add(new URL(base).hostname); } catch { /* Skip malformed config values. */ }
}

export function isImageUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function hostedProductImage(image) {
  if (typeof image !== 'string' || !image) return image;
  const knownSource = hostedUploads.get(image);
  if (knownSource) return knownSource;
  if (/^https?:\/\//i.test(image) && !image.includes('/uploads/')) return image;

  let pathname = image;
  if (/^https?:\/\//i.test(image)) {
    try {
      const url = new URL(image);
      if (!localUploadHosts.has(url.hostname)) return image;
      pathname = url.pathname;
    } catch {
      return image;
    }
    if (!/^\/(?:api\/)?uploads\//.test(pathname)) return image;
  }
  const filename = pathname.replace(/^\/?(?:api\/)?uploads\//, '').replace(/^\/+/, '');
  return hostedUploads.get('/uploads/' + filename) ?? image;
}

export function publicProductImage(image) {
  const source = hostedProductImage(image);
  if (typeof source !== 'string' || !source || isImageUrl(source)) return source;

  const filename = source.replace(/^\/?(?:api\/)?uploads\//, '');
  return `${backendUrl}/uploads/${filename}`;
}

export function productImagesWithUrls(product, resolve = hostedProductImage) {
  return {
    ...product,
    ...(Array.isArray(product.images) && { images: product.images.map(resolve) }),
    ...(Array.isArray(product.variants) && {
      variants: product.variants.map(variant => variant && ({
        ...variant,
        ...(variant.image && { image: resolve(variant.image) }),
        ...(Array.isArray(variant.images) && { images: variant.images.map(resolve) }),
      })),
    }),
  };
}

export function productImageReferences(images) {
  return [...new Set(images)].filter(image => referenceUrls.has(image));
}
