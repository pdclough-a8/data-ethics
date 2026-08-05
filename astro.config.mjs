import { defineConfig } from 'astro/config';

// Static output only — this becomes the SCORM package content, so everything
// must be self-contained (no server, no external requests at runtime).
export default defineConfig({
  output: 'static',
  build: {
    // Keep asset filenames stable/simple rather than Astro's default hashed
    // names — easier to reference from imsmanifest.xml and the SCORM wrapper.
    assets: 'assets',
  },
});
