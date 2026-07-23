# Koen Janssen — Official Website

A fast, modern, fully static website for Belgian composer **Koen Janssen**. No build step, no
frameworks, no dependencies — just HTML, CSS and a small amount of vanilla JavaScript, so it can be
dropped onto Netlify, GitHub Pages, or any static host as-is.

## Features

- Single-page design with sticky navigation, smooth scrolling and an active-section indicator
- Cinematic dark theme inspired by Koen's orchestral/trailer music
- Fully responsive (desktop, tablet and mobile) with an accessible mobile menu
- **Click-to-play embeds** for Spotify albums, SoundCloud tracks, YouTube and Vimeo videos.
  Players load only when clicked, keeping the initial page fast and light.
- Scroll reveal animations that respect `prefers-reduced-motion`
- SEO/social meta tags and favicons

## Project structure

```
.
├── index.html            # All page content
├── assets/
│   ├── css/style.css     # Styles
│   ├── js/main.js        # Interactions (nav, reveal, lazy embeds)
│   └── img/              # Artist photo, album covers, favicon
├── netlify.toml          # Netlify config (optional)
└── README.md
```

## Run locally

Because everything is static, you can just open `index.html` in a browser. For the embeds and
fonts to behave exactly like production, serve it over HTTP:

```bash
# Python 3
python -m http.server 8000
# then open http://localhost:8000
```

## Deploy

### Netlify
1. Push this folder to a Git repository (or drag-and-drop the folder into the Netlify dashboard).
2. Netlify detects `netlify.toml`; there is **no build command** and the publish directory is `.`.
3. Done.

### GitHub Pages
1. Push to a GitHub repository.
2. In **Settings → Pages**, set the source to the `main` branch, root (`/`) folder.
3. Your site will be live at `https://<user>.github.io/<repo>/`.

## Replacing the placeholder photos

The hero ships with a **placeholder artist photo** and the About section with a clean SVG
**placeholder** so you can drop in real photos of Koen whenever they're ready. To replace one:

1. Add your photo to `assets/img/` (JPG, PNG or WebP).
2. In `index.html`, update the matching `src`:
   - **Hero photo** &mdash; `assets/img/hero-artist.jpg` → your photo (best as a **landscape**
     shot with the subject on the **right** side, e.g. 1600×1067). It bleeds off the right edge and
     fades into the background behind the headline.
   - **About photo** &mdash; `assets/img/placeholder-landscape.svg` → your photo (best as
     **landscape, ~3:2**, e.g. 1200×800).

The images are automatically cropped to fit (`object-fit: cover`), so exact dimensions aren't
critical &mdash; just aim for roughly the right orientation.

## Editing content

- **Text & sections:** edit `index.html` directly.
- **Add an album:** copy an existing `<article class="album">` block in the Music section and update
  the cover image, title, and the Spotify album ID inside `data-src`.
- **Add a video:** copy a `<article class="vid ...">` block and change `data-id` (and `data-type`
  for `youtube`/`vimeo`). YouTube thumbnails load automatically from the video ID.
- **Colors/fonts:** tweak the CSS variables at the top of `assets/css/style.css`.

## Contact form (Web3Forms)

The contact form posts to [Web3Forms](https://web3forms.com) &mdash; no backend required. To activate it:

1. Go to [web3forms.com](https://web3forms.com), enter the destination email address, and copy the
   **access key** they send you (the free tier covers ~250 submissions/month).
2. In `index.html`, find the contact `<form>` and replace `YOUR_ACCESS_KEY_HERE` in the hidden
   `access_key` field with your key.

That's it &mdash; submissions are emailed to you. A hidden honeypot field (`botcheck`) filters out
basic spam bots, and the form shows an inline success/error message without leaving the page.

## Credits

Design & build: rebuilt as a static site from the original WordPress site.
All music, imagery and album artwork © Koen Janssen / respective rights holders.
