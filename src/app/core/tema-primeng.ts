import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

/**
 * Il tema di PrimeNG: Aura con il blu notte come colore di marca e l'arancione come accento.
 * I colori sono quelli delle schermate di riferimento scelte da Mahima (2026-10-17).
 */
export const BuonaCacciaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef2fb', 100: '#d9e2f5', 200: '#b5c6ea', 300: '#8aa4db', 400: '#5d7fc7',
      500: '#3a5fae', 600: '#2b4a8c', 700: '#223b72', 800: '#1b2f5c', 900: '#14234a', 950: '#0d1830',
    },
    colorScheme: {
      light: {
        primary: { color: '{primary.800}', contrastColor: '#ffffff', hoverColor: '{primary.700}', activeColor: '{primary.600}' },
        surface: { 0: '#ffffff', 50: '#f7f5f0', 100: '#efece4', 200: '#e3dfd3', 300: '#d0cbbb', 400: '#a29d8d', 500: '#76725f', 600: '#57543f', 700: '#403d2d', 800: '#2a2820', 900: '#1b1a14', 950: '#0f0f0b' },
      },
      dark: {
        primary: { color: '{primary.300}', contrastColor: '{primary.950}', hoverColor: '{primary.200}', activeColor: '{primary.100}' },
        surface: { 0: '#ffffff', 50: '#e6eaf3', 100: '#c9d1e3', 200: '#a3b0cd', 300: '#7c8db3', 400: '#566a98', 500: '#3b4d7a', 600: '#2a3a63', 700: '#1f2d52', 800: '#172342', 900: '#101a33', 950: '#0b1226' },
      },
    },
  },
});
