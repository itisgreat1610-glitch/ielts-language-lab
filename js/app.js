/**
 * app.js - Application Entry Point
 * Initializes the entire app on DOMContentLoaded
 */

import { state, setState, getState, emit, subscribe, getDueCards, getNewCards, initializeLevel } from './state.js';
import { initRouter, navigate, registerRoute } from './router.js';
import { loadShared, loadLevel, preloadLevel } from './loader.js';
import { createCard } from './srs.js';
import { startExercise } from './ui/exercise-shell.js?v=5';

// Exercise modules registry
const exerciseModules = {};

async function loadExerciseModule(type) {
  if (exerciseModules[type]) return exerciseModules[type];
  try {
    const mod = await import(`./exercises/${type}.js?v=5`);
    exerciseModules[type] = mod;
    return mod;
  } catch (err) {
    console.error(`Failed to load exercise module: ${type}`, err);
    return null;
  }
}

// Map exercise types to the data keys in level JSON files
const exerciseTypeToDataKey = {
  'word-match': 'word_match',
  'gap-fill': 'gap_fill',
  'collocation': 'collocation',
  'b1-b2-upgrade': 'b1_b2_upgrade',
  'paraphrase-match': 'paraphrase_match',
  'sentence-type-id': 'sentence_type_id',
  'sentence-transform': 'sentence_transform',
  'gps-placement': 'gps_placement',
