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
  'paragraph-assembly': 'paragraph_assembly',
  'essay-type-id': 'essay_type_sort'
};

// Map levels to their available exercise types
const levelExerciseTypes = {
  1: ['word-match', 'gap-fill'],
  2: ['collocation', 'b1-b2-upgrade'],
  3: ['sentence-type-id', 'sentence-transform'],
  4: ['gps-placement'],
  5: ['paragraph-assembly'],
  6: ['essay-type-id']
};

// ============================================================================
// Placeholder Auth Module (to be replaced with real Firebase auth in Phase 2)
// ============================================================================
const auth = {
  user: null,
  onAuthChange: (callback) => {
    // For now, check localStorage for demo user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      auth.user = JSON.parse(savedUser);
      callback(auth.user);
    }
  },
  signOut: () => {
    auth.user = null;
    localStorage.removeItem('user');
    setState({ user: null });
  }
};

// ============================================================================
// Placeholder DB Module (to be replaced with real Firebase in Phase 2)
// ============================================================================
const db = {
  loadUserData: async () => {
    const saved = localStorage.getItem('userData');
    if (saved) {
      return JSON.parse(saved);
    }
    return { cards: {} };
  },
  saveUserData: async (data) => {
    localStorage.setItem('userData', JSON.stringify(data));
  }
};

// ============================================================================
// Placeholder Offline Module (to be enhanced in Phase 2)
// ============================================================================
const offline = {
  init: () => {
    window.addEventListener('online', () => {
      setState({ isOnline: true });
      console.log('App is online');
    });
    window.addEventListener('offline', () => {
      setState({ isOnline: false });
      console.log('App is offline');
    });
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format a date string for display
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "April 2")
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/**
 * Get daily review summary
 * @returns {Object} { dueTotal, newTotal }
 */
function getDailySummary() {
  let dueTotal = 0;
  let newTotal = 0;

  Object.keys(state.cards).forEach(levelId => {
    const level = parseInt(levelId);
    dueTotal += getDueCards(level).length;
    newTotal += getNewCards(level, Infinity).length;
  });

  return { dueTotal, newTotal };
}

/**
 * Create HTML for level card
 * @param {number} levelNum - Level number
 * @param {boolean} isUnlocked - Whether level is unlocked
 * @returns {string} HTML string
 */
function createLevelCardHTML(levelNum, isUnlocked) {
  const progress = state.progress[String(levelNum)] || { completed: 0, total: 0, dueToday: 0 };
  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const locked = !isUnlocked ? 'locked' : '';
  const lockIcon = !isUnlocked ? 'ð' : '';

  return `
    <div class="level-card ${locked}" data-level="${levelNum}">
      <div class="level-number">${lockIcon}Level ${levelNum}</div>
      <div class="progress-info">
        <span class="progress-text">${progress.completed}/${progress.total}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="due-badge">${progress.dueToday} due today</div>
    </div>
  `;
}
ËÈOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOBËÈØÜY[[\\ÂËÈOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOBÊ
[\ÛYHØÜY[
Â[Ý[Û[\ÛYTØÜY[
HÂÛÛÝÛÛZ[\HØÝ[Y[]Y\TÙ[XÝÜ	ÖÙ]K\ØÜY[HÛYHIÊNÂY
XÛÛZ[\H]\ÂÛÛÝÈYUÝ[]ÕÝ[HHÙ]Z[TÝ[[X\J
NÂÛÛÝZ[QÛØ[HÝ]KÙ][ÜËZ[QÛØ[ÂÛÛÝÙ^HH]È]J
KÒTÓÔÝ[Ê
KÜ]
	Õ	ÊVÌNÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[Ù[ÛÛYIÜÝ]K\Ù\È	Ë	È
È
Ý]K\Ù\\Ü^S[YH	ÓX\\ÊH	ÉßHOÚ]Û\ÜÏHZ[K\Ý[[X\H]Û\ÜÏHÝ[[X\KXØ\]Û\ÜÏHÝ[[X\K[[X\ÙYUÝ[OÙ]]Û\ÜÏHÝ[[X\K[X[YHÙ^OÙ]Ù]]Û\ÜÏHÝ[[X\KXØ\]Û\ÜÏHÝ[[X\K[[X\Û]ÕÝ[OÙ]]Û\ÜÏHÝ[[X\K[X[]ÈØ\ÏÙ]Ù]]Û\ÜÏHÝ[[X\KXØ\]Û\ÜÏHÝ[[X\K[[X\ÙZ[QÛØ[OÙ]]Û\ÜÏHÝ[[X\K[X[Z[HÛØ[Ù]Ù]Ù]]ÛÛ\ÜÏH\[X\HYHÝ\\XÝXÙKXÝ\XÝXÙH
	ÙYUÝ[È	Ô]Y]ÉÈ	ÓX\ßJBØ]Û]Û\ÜÏH]ZXÚË\Ý]ÈÏ]ZXÚÈÝ]ÏÚÏ	ÓØXÝÙ^\ÊÝ]KÙÜ\ÜÊK[ÝOOHÈ	ÏÈ][ÈÝ\YY]ÚÛÜÙHH][ÈYÚ[OÜÈ	ÉßBÙ]	ÜÝ]K\Ù\È]ÛÛ\ÜÏH\ÙXÛÛ\HYHÚYÛ[Ý]XÚYÛÝ]Ø]Û	ÉßBÙ]ÂËÈ][\Ý[\ÂÛÛÝÝ\HÛÛZ[\]Y\TÙ[XÝÜ	ÈÜÝ\\XÝXÙKXÊNÂY
Ý\HÂÝ\Y][\Ý[\	ØÛXÚÉË

HOÂ]YØ]J^\Ú\ÙX
NÂJNÂBÛÛÝÚYÛÝ]HÛÛZ[\]Y\TÙ[XÝÜ	ÈÜÚYÛ[Ý]XÊNÂY
ÚYÛÝ]HÂÚYÛÝ]Y][\Ý[\	ØÛXÚÉË

HOÂ]]ÚYÛÝ]

NÂ]YØ]J	ÛÙÚ[ÊNÂJNÂBBÊ
[\][ÈØÜY[
Â[Ý[Û[\][ÔØÜY[
HÂÛÛÝÛÛZ[\HØÝ[Y[]Y\TÙ[XÝÜ	ÖÙ]K\ØÜY[H][ÈIÊNÂY
XÛÛZ[\H]\ÂÛÛÝ][ÛÝ[HLÂ][H	Ï]Û\ÜÏHØÜY[XÛÛ[QSÈ][ÏÚ]Û\ÜÏH][ËYÜYÎÂÜ
]HHNÈHH][ÛÝ[ÈJÊÊHÂÛÛÝ\Õ[ØÚÙYHÝ]KÝ\[][HNÂ[
ÏHÜX]S][Ø\S
K\Õ[ØÚÙY
NÂB[
ÏH	ÏÙ]Ù]ÎÂÛÛZ[\[\SH[ÂËÈYÛXÚÈ\Ý[\ÈÈ][Ø\ÂÛÛZ[\]Y\TÙ[XÝÜ[
	Ë][XØ\Ý
ØÚÙY
IÊKÜXXÚ
Ø\OÂØ\Y][\Ý[\	ØÛXÚÉË

HOÂÛÛÝ][[HH\ÙR[
Ø\]\Ù]][
NÂÙ]Ý]JÈÝ\[][][[HJNÂ]YØ]J^\Ú\ÙX
NÂJNÂJNÂBÊ
[\ÙÚ[ØÜY[
Â[Ý[Û[\ÙÚ[ØÜY[
HÂÛÛÝÛÛZ[\HØÝ[Y[]Y\TÙ[XÝÜ	ÖÙ]K\ØÜY[HÙÚ[IÊNÂY
XÛÛZ[\H]\ÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[ÙÚ[XÛÛ[OQSÈ[ÝXYÙHXÚOÛ\ÜÏHÝX]HX\Ý\[Û\ÚÜHQSÈ^[OÜ]Û\ÜÏHÙÚ[X]ÛÈ]ÛÛ\ÜÏHYÛÛÙÛHYHÛÛÙÛK\ÚYÛZ[XÚYÛ[Ú]ÛÛÙÛBØ]Û]ÛÛ\ÜÏHY[[ÈYH[[Ë\ÚYÛZ[XÛÛ[YH\È[[È\Ù\Ø]ÛÙ]Û\ÜÏHÙÚ[[ÝHÈXØÛÝ[ÈÙIÛÜX]HÛHÜ[ÝKÜÙ]ÂËÈ[[ÈÚYÛ[ÛÛÝ[[ÐHÛÛZ[\]Y\TÙ[XÝÜ	ÈÙ[[Ë\ÚYÛZ[XÊNÂY
[[ÐHÂ[[ÐY][\Ý[\	ØÛXÚÉË\Þ[È

HOÂÛÛÝ[[Õ\Ù\HÂZY	Ù[[Ë]\Ù\Ë[XZ[	Ù[[Ð^[\KÛÛIË\Ü^S[YN	Ñ[[È\Ù\ÂNÂØØ[ÝÜYÙKÙ]][J	Ý\Ù\ËÓÓÝ[ÚYJ[[Õ\Ù\JNÂÙ]Ý]JÈ\Ù\[[Õ\Ù\JNÂ]ØZ][]X[^U\Ù\]J
NÂ]YØ]J	ÚÛYIÊNÂJNÂBËÈÛÛÙÛHÚYÛ[
XÙZÛ\BÛÛÝÛÛÙÛPHÛÛZ[\]Y\TÙ[XÝÜ	ÈÙÛÛÙÛK\ÚYÛZ[XÊNÂY
ÛÛÙÛPHÂÛÛÙÛPY][\Ý[\	ØÛXÚÉË

HOÂ[\
	ÑÛÛÙÛHÚYÛR[Ú[H[\[Y[Y[\ÙHÚ]\X\ÙIÊNÂJNÂBBÊ
[\\ÚØ\ØÜY[
Â[Ý[Û[\\ÚØ\ØÜY[
HÂÛÛÝÛÛZ[\HØÝ[Y[]Y\TÙ[XÝÜ	ÖÙ]K\ØÜY[H\ÚØ\IÊNÂY
XÛÛZ[\H]\ÂÛÛÝÝ[ÛÛ\]YHØXÝ[Y\ÊÝ]KÙÜ\ÜÊKYXÙJ
Ý[K
HOÝ[H
ÈÛÛ\]Y
NÂÛÛÝÝ[Ø\ÈHØXÝ[Y\ÊÝ]KÙÜ\ÜÊKYXÙJ
Ý[K
HOÝ[H
ÈÝ[
NÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[\ÚØ\Ú]Û\ÜÏHÝ]ËYÜY]Û\ÜÏHÝ]XÞ]Û\ÜÏHÝ][[X\ÝÝ[Ø\ßOÙ]]Û\ÜÏHÝ][X[Ý[Ø\ÏÙ]Ù]]Û\ÜÏHÝ]XÞ]Û\ÜÏHÝ][[X\ÝÝ[ÛÛ\]YOÙ]]Û\ÜÏHÝ][X[ÛÛ\]YÙ]Ù]]Û\ÜÏHÝ]XÞ]Û\ÜÏHÝ][[X\ÝÝ[Ø\ÈÈX]Ý[

Ý[ÛÛ\]YÈÝ[Ø\ÊH
L
HIOÙ]]Û\ÜÏHÝ][X[Ý\[ÙÜ\ÜÏÙ]Ù]Ù]]Û\ÜÏHÝ]ËXK[][ÏÙÜ\ÜÈH][ÚÏ	ÓØXÝÙ^\ÊÝ]KÙÜ\ÜÊKX\
][YOÂÛÛÝ][H\ÙR[
][Y
NÂÛÛÝHÝ]KÙÜ\ÜÖÛ][YNÂÛÛÝÝHÝ[ÈX]Ý[

ÛÛ\]YÈÝ[
H
L
HÂ]\]Û\ÜÏH][\Ý]Ü[Û\ÜÏH][[[YH][	Û][OÜÜ[]Û\ÜÏHZ[KX\]Û\ÜÏHZ[KY[Ý[OHÚY	ÜÝIHÙ]Ù]Ü[Û\ÜÏH][\ÝÜÝIOÜÜ[Ù]ÂJKÚ[	ÉÊ_BÙ]Ù]ÂBÊ
[\Ù][ÜÈØÜY[
Â[Ý[Û[\Ù][ÜÔØÜY[
HÂÛÛÝÛÛZ[\HØÝ[Y[]Y\TÙ[XÝÜ	ÖÙ]K\ØÜY[HÙ][ÜÈIÊNÂY
XÛÛZ[\H]\ÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[Ù][ÜÏÚ]Û\ÜÏHÙ][ÜËYÜÝ\X[Z[HÛØ[
Ø\ÊOÛX[]Û\ÜÏHÙ][ËXÛÛÛ[]\OH[X\YHZ[KYÛØ[Z[][YOHÜÝ]KÙ][ÜËZ[QÛØ[HZ[HHX^HLÙ]Ù]]Û\ÜÏHÙ][ÜËYÜÝ\X[ÝYXØ][ÛÏÛX[]Û\ÜÏHÙ][ËXÛÛÛ[]\OHÚXÚØÞYHÝYXØ][ÛË]ÙÙÛH	ÜÝ]KÙ][ÜËÝYXØ][ÛÑ[XYÈ	ØÚXÚÙY	È	ÉßOÜ[ÜÝ]KÙ][ÜËÝYXØ][ÛÑ[XYÈ	Ñ[XY	È	Ñ\ØXY	ßOÜÜ[Ù]Ù]]Û\ÜÏHÙ][ÜËYÜÝ\X[[YOÛX[]Û\ÜÏHÙ][ËXÛÛÛÙ[XÝYH[YK\Ù[XÝÜ[Û[YOHYÚ	ÜÝ]KÙ][ÜË[YHOOH	ÛYÚ	ÈÈ	ÜÙ[XÝY	È	ÉßOYÚÛÜ[ÛÜ[Û[YOH\È	ÜÝ]KÙ][ÜË[YHOOH	Ù\ÉÈÈ	ÜÙ[XÝY	È	ÉßO\ÏÛÜ[ÛÜÙ[XÝÙ]Ù]]ÛÛ\ÜÏH\ÙXÛÛ\HYHØ]K\Ù][ÜËXØ]HÙ][ÜÏØ]ÛÙ]ÂËÈ][\Ý[\ÂÛÛÝØ]PHÛÛZ[\]Y\TÙ[XÝÜ	ÈÜØ]K\Ù][ÜËXÊNÂY
Ø]PHÂØ]PY][\Ý[\	ØÛXÚÉË

HOÂÛÛÝ]ÔÙ][ÜÈHÂZ[QÛØ[\ÙR[
ÛÛZ[\]Y\TÙ[XÝÜ	ÈÙZ[KYÛØ[Z[]	ÊK[YJKÝYXØ][ÛÑ[XYÛÛZ[\]Y\TÙ[XÝÜ	ÈÛÝYXØ][ÛË]ÙÙÛIÊKÚXÚÙY[YNÛÛZ[\]Y\TÙ[XÝÜ	ÈÝ[YK\Ù[XÝ	ÊK[YBNÂÙ]Ý]JÈÙ][ÜÎÈÝ]KÙ][ÜË]ÔÙ][ÜÈHJNÂ[\
	ÔÙ][ÜÈØ]YIÊNÂJNÂBBÊ
[\^\Ú\ÙHØÜY[8 %ØYÈ[Ý\ÈX[^\Ú\ÙH[Ù[\Â
Â\Þ[È[Ý[Û[\^\Ú\ÙTØÜY[]\[\ÊHÂÛÛÝÛÛZ[\HØÝ[Y[]Y\TÙ[XÝÜ	ÖÙ]K\ØÜY[H^\Ú\ÙHIÊNÂY
XÛÛZ[\H]\ÂÛÛÝ^\Ú\ÙU\HH\[\Ë\NÂÛÛÝ][HÝ]KÝ\[][ÂËÈYÈÜXÚYXÈ\H\]Y\ÝYÚÝÈ^\Ú\ÙHXÚÙ\Ü\È][Y
Y^\Ú\ÙU\HY^\Ú\ÙU\UÑ]RÙ^VÙ^\Ú\ÙU\WJHÂ[\^\Ú\ÙTXÚÙ\ÛÛZ[\][
NÂ]\ÂBËÈÚÝÈØY[ÈÝ]BÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[ØY[È^\Ú\ÙKÜÙ]ÂHÂËÈØYH^\Ú\ÙH[Ù[H[][]H[\[[ÛÛÝÙ^\Ú\ÙS[Ù[K][]WHH]ØZ]ÛZ\ÙK[
ÂØY^\Ú\ÙS[Ù[J^\Ú\ÙU\JKØY][
][
BJNÂY
Y^\Ú\ÙS[Ù[JHÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[^\Ú\ÙHÝ]Z[XHY]Ü]ÛÛ\ÜÏH\ÙXÛÛ\HYHXÚËXXÚÏØ]ÛÙ]ÂÛÛZ[\]Y\TÙ[XÝÜ	ÈØXÚËXÊOËY][\Ý[\	ØÛXÚÉË

HO]YØ]J	Û][ÉÊJNÂ]\ÂBËÈÙ]H^\Ú\ÙH][\ÈÛH][]BÛÛÝ]RÙ^HH^\Ú\ÙU\UÑ]RÙ^VÙ^\Ú\ÙU\WNÂÛÛÝ][\ÈH][]K^\Ú\Ù\ÏËÙ]RÙ^WH×NÂY
][\Ë[ÝOOH
HÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[È^\Ú\Ù\È]Z[XHÜ\È\H]][	Û][KÜ]ÛÛ\ÜÏH\ÙXÛÛ\HYHXÚËXXÚÈÈ][ÏØ]ÛÙ]ÂÛÛZ[\]Y\TÙ[XÝÜ	ÈØXÚËXÊOËY][\Ý[\	ØÛXÚÉË

HO]YØ]J	Û][ÉÊJNÂ]\ÂBËÈÝ\H^\Ú\ÙH\Ú[ÈHÚ[Ý\^\Ú\ÙJÛÛZ[\Â^\Ú\ÙU\K][]N][\Ë^\Ú\ÙS[Ù[KÝ\[][][ÛÛÛ\]N
\Ý[ÊHOÂÛÛÛÛKÙÊ	Ñ^\Ú\ÙHÛÛ\]NË\Ý[ÊNÂËÈØ]HÙÜ\ÜÂÛÛÝÙÜ\ÜÈHÝ]KÙÜ\ÜÖÔÝ[Ê][
WHÈÛÛ\]YÝ[][\Ë[ÝYUÙ^NNÂÙÜ\ÜËÛÛ\]YHX]X^
ÙÜ\ÜËÛÛ\]Y\Ý[ËØÛÜJNÂÙ]Ý]JÈÙÜ\ÜÎÈÝ]KÙÜ\ÜËÔÝ[Ê][
WNÙÜ\ÜÈHJNÂËÈØ]HÈØØ[ÝÜYÙBØ]U\Ù\]JÈØ\ÎÝ]KØ\ËÙÜ\ÜÎÝ]KÙÜ\ÜËÙ][ÜÎÝ]KÙ][ÜÈJNÂBJNÂHØ]Ú
\HÂÛÛÛÛK\Ü	ÑZ[YÈÝ\^\Ú\ÙNË\NÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[\ÜØY[È^\Ú\ÙKX\ÙHHYØZ[Ü]ÛÛ\ÜÏH\ÙXÛÛ\HYHXÚËXXÚÏØ]ÛÙ]ÂÛÛZ[\]Y\TÙ[XÝÜ	ÈØXÚËXÊOËY][\Ý[\	ØÛXÚÉË

HO]YØ]J	Û][ÉÊJNÂBBÊ
ÚÝÈ^\Ú\ÙH\HXÚÙ\ÜHÚ][][
Â[Ý[Û[\^\Ú\ÙTXÚÙ\ÛÛZ[\][
HÂÛÛÝ\\ÈH][^\Ú\ÙU\\ÖÛ][H×NÂY
\\Ë[ÝOOH
HÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[][	Û][OÚ^\Ú\Ù\ÈÜ\È][\HÛÛZ[ÈÛÛÛOÜ]ÛÛ\ÜÏH\ÙXÛÛ\HYHXÚËXXÚÈÈ][ÏØ]ÛÙ]ÂÛÛZ[\]Y\TÙ[XÝÜ	ÈØXÚËXÊOËY][\Ý[\	ØÛXÚÉË

HO]YØ]J	Û][ÉÊJNÂ]\ÂBÛÛÝ\S[Y\ÈHÂ	ÝÛÜ[X]Ú	ÎÈ[YN	ÕÛÜX]Ú	Ë\ØÎ	ÓX]ÚÛÜÈÈZ\Y[][ÛÉËXÛÛ	ü'å)	ÈK	ÙØ\Y[	ÎÈ[YN	ÑØ\[	Ë\ØÎ	ÐÛÛ\]HÙ[[Ù\ÈÚ]HYÚÛÜ	ËXÛÛ	ü'äçIÈK	ØÛÛØØ][ÛÎÈ[YN	ÐÛÛØØ][ÛX]Ú	Ë\ØÎ	Ñ[]\[ÛÜ\\ÉËXÛÛ	ü'é'IÈK	ØKX]\ÜYIÎÈ[YN	Ðx¡¤\ÜYIË\ØÎ	Õ\ÜYH\ÚXÈÛÜÈÈ[
ÊÉËXÛÛ	ø«!»î#ÉÈK	Ü\\\ÙK[X]Ú	ÎÈ[YN	Ô\\\ÙHX]Ú	Ë\ØÎ	ÓX]Ú^ÈÈZ\\\\Ù\ÉËXÛÛ	ü'å!	ÈK	ÜÙ[[ÙK]\KZY	ÎÈ[YN	ÔÙ[[ÙH\HQ	Ë\ØÎ	ÒY[YHÙ[[ÙHÝXÝ\\ÉËXÛÛ	ü'å#IÈK	ÜÙ[[ÙK][ÙÜIÎÈ[YN	ÔÙ[[ÙH[ÙÜIË\ØÎ	Õ[ÙÜHÙ[[ÙH\\ÉËXÛÛ	ø§#ûî#ÉÈK	ÙÜË\XÙ[Y[	ÎÈ[YN	ÑÔÈXÙ[Y[	Ë\ØÎ	ÔXÙH\Ù\È[QQSÕTTHÛÝÉËXÛÛ	ü'äãIÈK	Ü\YÜ\X\ÜÙ[XIÎÈ[YN	Ô\YÜ\\ÜÙ[XIË\ØÎ	ÐZ[ÔË\ÝXÝ\Y\YÜ\ÉËXÛÛ	ü'ãåûî#ÉÈK	Ù\ÜØ^K]\KZY	ÎÈ[YN	Ñ\ÜØ^H\HQ	Ë\ØÎ	ÒY[YHQSÈ\ÜØ^H\\ÉËXÛÛ	ü'äâÉÈBNÂÛÛZ[\[\SH]Û\ÜÏHØÜY[XÛÛ[][	Û][H^\Ú\Ù\ÏÚ]Û\ÜÏH^\Ú\ÙK\XÚÙ\	Ý\\ËX\
\HOÂÛÛÝ[ÈH\S[Y\ÖÝ\WHÈ[YN\K\ØÎ	ÉËXÛÛ	ü'äæÈNÂ]\]Û\ÜÏH^\Ú\ÙK\XÚËXØ\]K]\OHÝ\_HÜ[Û\ÜÏH^\Ú\ÙK\XÚËZXÛÛÚ[ËXÛÛOÜÜ[]Û\ÜÏH^\Ú\ÙK\XÚËZ[ÈÝÛÏÚ[Ë[Y_OÜÝÛÏÜ[Ú[Ë\ØßOÜÜ[Ù]Ù]ÂJKÚ[	ÉÊ_BÙ]]ÛÛ\ÜÏH\ÙXÛÛ\HYHXÚËXÝ[OHX\Ú[]ÜK\[HXÚÈÈ][ÏØ]ÛÙ]ÂËÈYÛXÚÈ[\ÂÛÛZ[\]Y\TÙ[XÝÜ[
	Ë^\Ú\ÙK\XÚËXØ\	ÊKÜXXÚ
Ø\OÂØ\Y][\Ý[\	ØÛXÚÉË

HOÂ  navigate(`exercise/${card.dataset.type}`);
    });
  });
  container.querySelector('#back-btn')?.addEventListener('click', () => navigate('levels'));
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize user data (load from DB or create new)
 */
async function initializeUserData() {
  try {
    // Load shared data first
    const shared = await loadShared();

    // Load user's existing data
    const userData = await db.loadUserData();

    // If user has no cards for any level, initialize levels
    if (Object.keys(userData.cards || {}).length === 0) {
      // Initialize first level with cards
      const level1Data = await loadLevel(1);
      if (level1Data.cards) {
        initializeLevel(1, level1Data.cards.map(c => c.id));
      }
    } else {
      // Load existing user data
      state.cards = userData.cards;
      // Recalculate progress
      Object.keys(state.cards).forEach(levelId => {
        const level = parseInt(levelId);
        // This is already done in state.loadUserData
      });
    }

    // Load user settings if available
    if (userData.settings) {
      state.settings = { ...state.settings, ...userData.settings };
    }

    emit('userDataInitialized', {});
  } catch (err) {
    console.error('Failed to initialize user data:', err);
    // Continue anyway - user can still browse
  }
}

/**
 * Main app initialization
 */
async function initApp() {
  // Show splash screen
  const splash = document.querySelector('.splash-screen');
  if (splash) {
    splash.style.display = 'flex';
  }

  try {
    // Initialize online/offline detection
    offline.init();

    // Register all routes FIRST (before any navigate() calls)
    registerRoute('home', renderHomeScreen);
    registerRoute('levels', renderLevelsScreen);
    registerRoute('login', renderLoginScreen);
    registerRoute('dashboard', renderDashboardScreen);
    registerRoute('settings', renderSettingsScreen);
    registerRoute('exercise', renderExerciseScreen);

    // Initialize router (must be after registering routes)
    initRouter();

    // Set up auth listener
    auth.onAuthChange(async (user) => {
      if (user) {
        setState({ user });
        // Load user data if not already loaded
        if (Object.keys(state.cards).length === 0) {
          await initializeUserData();
        }
        navigate('home');
      } else {
        setState({ user: null });
        navigate('login');
      }
    });

    // Check if already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setState({ user });
      await initializeUserData();
      navigate('home');
    } else {
      navigate('login');
    }

    // Set up bottom navigation
    const navButtons = {
      'nav-home': 'home',
      'nav-levels': 'levels',
      'nav-practice': 'exercise',
      'nav-dashboard': 'dashboard',
      'nav-settings': 'settings'
    };

    Object.entries(navButtons).forEach(([id, path]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => navigate(path));
      }
    });

    // Subscribe to state changes for bottom nav highlighting
    subscribe('routeChanged', ({ path }) => {
      document.querySelectorAll('[data-nav]').forEach(el => {
        el.classList.remove('active');
      });
      const activeBtn = document.querySelector(`[data-nav="${path}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
      }
    });

    console.log('App initialized successfully');
  } catch (err) {
    console.error('App initialization failed:', err);
  } finally {
    // Hide splash screen
    if (splash) {
      splash.style.display = 'none';
    }
  }
}

// ============================================================================
// Start the app when DOM is ready
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
