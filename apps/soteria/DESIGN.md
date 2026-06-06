---
name: "Startseite"
description: "Design tokens extracted from https://www.bahn.de/"
colors:
  primary: "#EC0016"
  secondary: "#0C3992"
  surface: "#D7DCE1"
  on-surface: "#282D37"
typography:
  text-1:
    fontFamily: "DBScreenHead"
    fontSize: "32px"
    fontWeight: 900
    lineHeight: 1.25
  text-2:
    fontFamily: "Deutsche_Bahn_VUX"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "\"liga\""
  text-3:
    fontFamily: "DBScreenSans"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 0.75
  text-4:
    fontFamily: "DBScreenSans"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 0.75
  text-5:
    fontFamily: "DBScreenHead"
    fontSize: "32px"
    fontWeight: 900
    lineHeight: 1.25
  text-6:
    fontFamily: "DBScreenHead"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1.33
  text-7:
    fontFamily: "DBScreenHead"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: 1.2
  text-8:
    fontFamily: "Deutsche_Bahn_VUX"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "\"liga\""
  text-9:
    fontFamily: "DBScreenSans"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.4
  text-10:
    fontFamily: "DBScreenHead"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: 1.2
  text-11:
    fontFamily: "DBScreenHead"
    fontSize: "18px"
    fontWeight: 900
    lineHeight: 1.33
  text-12:
    fontFamily: "DBScreenHead"
    fontSize: "18px"
    fontWeight: 900
    lineHeight: 1.33
  text-13:
    fontFamily: "DBScreenHead"
    fontSize: "18px"
    fontWeight: 900
    lineHeight: 1.33
  text-14:
    fontFamily: "DBScreenSans"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1
  text-15:
    fontFamily: "DBScreenSans"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
  text-16:
    fontFamily: "DBScreenSans"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  text-17:
    fontFamily: "DBScreenSans"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  text-18:
    fontFamily: "DBScreenSans"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1
  text-19:
    fontFamily: "DBScreenSans"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.5
  text-20:
    fontFamily: "DBScreenSans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  text-21:
    fontFamily: "DBScreenSans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  text-22:
    fontFamily: "DBScreenHead"
    fontSize: "14px"
    fontWeight: 900
    lineHeight: 1.29
  text-23:
    fontFamily: "DBScreenHead"
    fontSize: "14px"
    fontWeight: 900
    lineHeight: 1.29
  text-24:
    fontFamily: "DBScreenSans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1
  text-25:
    fontFamily: "DBScreenSans"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.43
  text-26:
    fontFamily: "DBScreenSans"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.43
  text-27:
    fontFamily: "DBScreenSans"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.1
  text-28:
    fontFamily: "DBScreenSans"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.5
  text-29:
    fontFamily: "DBScreenSans"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  text-30:
    fontFamily: "DBScreenSans"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.3
  text-31:
    fontFamily: "DBScreenSans"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  text-32:
    fontFamily: "Deutsche_Bahn_VUX"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "\"liga\""
spacing:
  base: "8px"
  xs: "2px"
  sm: "7px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  xxl: "16px"
  xxxl: "20px"
  xxxxl: "24px"
rounded:
  sm: "4px"
  md: "7.5px"
  lg: "12px"
  full: "9999px"
components:
  button-observed:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "16px 32px"
  input-observed:
    backgroundColor: "#F0F3F5"
    textColor: "{colors.on-surface}"
    rounded: "0px"
    padding: "20px 16px 16px 48px"
---

# Design System

## Overview
Design tokens extracted from bahn.de. The YAML front matter contains machine-readable values observed by Dembrandt when available; the sections below summarize the extracted evidence without redesigning or correcting the source site.

## Colors
- **Primary** (#EC0016): Observed color token extracted from the site's palette, semantic CSS, or component styles.
- **Secondary** (#0C3992): Observed color token extracted from the site's palette, semantic CSS, or component styles.
- **Surface** (#D7DCE1): Observed color token extracted from the site's palette, semantic CSS, or component styles.
- **On Surface** (#282D37): Observed color token extracted from the site's palette, semantic CSS, or component styles.

## Typography
- **Text 1**: DBScreenHead, 32px, extra-bold
- **Text 2**: Deutsche_Bahn_VUX, 32px, regular
- **Text 3**: DBScreenSans, 32px, regular
- **Text 4**: DBScreenSans, 32px, regular
- **Text 5**: DBScreenHead, 32px, extra-bold
- **Text 6**: DBScreenHead, 24px, extra-bold

## Layout
Observed spacing scale: 8px spacing scale.
- **Spacing tokens**: base 8px, xs 2px, sm 7px, md 8px, lg 10px, xl 12px, xxl 16px, xxxl 20px, xxxxl 24px
- **Responsive breakpoints**: 320px, 375px, 600px, 601px, 767px, 768px

## Elevation & Depth
Observed box-shadow styles: rgba(0, 0, 0, 0.3) 0px 3px 4px -2px; color(srgb 0 0 0 / 0.3) 0px 2px 4px 0px; rgba(0, 0, 0, 0.3) 0px 2px 8px 0px

## Shapes
Observed rounded-corner tokens: sm 4px, md 7.5px, lg 12px, full 9999px.

## Components
- **Buttons**: Observed sample with radius 4px, background #EC0016, text #FFFFFF, padding 16px 32px
- **Inputs**: Observed sample with 0px radius