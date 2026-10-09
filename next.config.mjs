import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import fs from 'node:fs';
import { parse } from 'yaml';

// Articles marked "offline" in content/site.yaml redirect to the homepage.
function offlineArticleRedirects() {
  const content = parse(fs.readFileSync('./content/site.yaml', 'utf8'));
  return (content.articles ?? [])
    .filter((a) => a.status === 'offline' && a.url?.startsWith('/'))
    .map((a) => ({
      source: encodeURI(a.url).replace(/:/g, '\\:'),
      destination: '/',
      permanent: false,
    }));
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  async redirects() {
    return offlineArticleRedirects();
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
  },
});

export default withMDX(nextConfig);
