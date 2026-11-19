# Vaccine Needle Depth Guide

A one-page web tool from **[Examined](https://mccormickmd.substack.com/)** by Ryan McCormick, M.D.

It helps a person getting a vaccine talk with the medical assistant, nurse, pharmacist, or technician about needle length, skin technique (normal tension, stretched flat, or bunched), and arm position. After the user enters their age, weight, sex, and vaccine, it produces a short report they can show on a phone or print.

> **Disclaimer:** For discussion and education purposes only. This tool does not represent medical advice and does not replace the judgment of the person giving the vaccine.

## What it does

- Sorts vaccines by route: into muscle (IM), under the skin (SC), either route, or no needle.
- Shows the CDC-recommended IM needle length for the person's age group. For adults it uses weight and sex.
- Explains normal tension, stretched flat, and bunched technique, and highlights what fits the user's size.
- Includes a positioning reminder, questions to ask, and when to call about shoulder pain afterward.
- Offers print / save-as-PDF output.

Needle lengths follow the [CDC needle length and gauge tables](https://www.cdc.gov/vaccines/hcp/administration/during.html).

## Privacy

Everything runs in the browser. There's no server, no analytics, no cookies, and nothing is stored or sent.

## Files

```
index.html                 page structure, form, sources, footer
styles.css                 layout, mobile and print styles
app.js                     vaccine list, CDC needle logic, report builder
images/examined-header.png header graphic (links to the Substack)
```

## Publish on GitHub Pages

1. Create a new public repository on GitHub, for example `vaccine-needle-guide`.
2. Upload all four items above, keeping the `images` folder, to the root of the repository. You can drag the unzipped files onto **Add file → Upload files**.
3. Go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute or two the site will be live at `https://<your-username>.github.io/vaccine-needle-guide/`.

To preview locally, open `index.html` in any browser. No build step is needed.

## Updating the content

- **Vaccine list and routes:** edit the `VACCINES` array at the top of `app.js`.
- **Needle lengths:** edit `imRecommendation()` in `app.js`. Adult weight bands are in pounds, matching CDC (<130, 130–152, then 153–200 for women and 153–260 for men).
- **Technique text:** edit `techniqueAdvice()` in `app.js`.

Check the CDC table and product package inserts periodically. Routes and products change. For example, the FDA added an IM route for M-M-R II, Varivax, and ProQuad in 2023.
