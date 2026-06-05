# Music Portfolio

A responsive HTML/CSS portfolio page for showcasing your music projects.

## Setup

1. Replace placeholder content in `index.html`:
   - Your name, bio, and contact info
   - Project titles, descriptions, and embed links
   - Social media links

2. Add your images to `assets/images/`:
   - `project-placeholder.jpg` - Album/project covers (300x300px recommended)
   - `photo-1.jpg` through `photo-6.jpg` - Gallery images
   - `artist-photo.jpg` - Your portrait for the About section

3. Add audio files to `assets/audio/` (optional):
   - Use the HTML5 `<audio>` player for direct MP3 hosting

## Embedding Music Players

### Spotify

Replace the `src` in the Spotify iframe with your album/track embed URL:

```
https://open.spotify.com/embed/album/YOUR_ALBUM_ID
```

### SoundCloud

Replace the `src` with your track URL:

```
https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/YOUR_TRACK
```

### Bandcamp

Use the Bandcamp embed code from your album page.

## Customizing

- **Colors**: Edit CSS variables in `:root` at the top of `css/styles.css`
- **Fonts**: Change the `font-family` in the `body` selector
- **Layout**: Adjust grid columns and breakpoints in the media queries

## Opening the Page

Just open `index.html` in any browser, or use a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`
