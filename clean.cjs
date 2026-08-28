const fs = require('fs');
let code = fs.readFileSync('client/src/App.tsx', 'utf8');

// Remove imports
code = code.replace(/import \{ Joyride, STATUS \} from 'react-joyride';\r?\n/, '');
code = code.replace(/import type \{ Step \} from 'react-joyride';\r?\n/, '');

// Remove state and functions
code = code.replace(/  \/\/ Joyride \(Tutorial\) State[\s\S]*?const tutorialSteps: Step\[\] = \[[\s\S]*?  \];\r?\n/, '');

// Remove Joyride component
code = code.replace(/      <Joyride[\s\S]*?\/>\r?\n/, '');

// Remove ids
code = code.replace(/ id=\"tour-[a-z-]+\"/g, '');

fs.writeFileSync('client/src/App.tsx', code);
console.log('Done');
