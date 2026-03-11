const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('c:/Users/hp/Desktop/ADi/Project/NEWIOLDAGEHOME/frontend/app', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Make a backup just in case
    fs.writeFileSync(filePath + '.calm.bak', content, 'utf8');

    // 1. COLORS
    // Backgrounds
    content = content.replace(/bg-\[#f1f3f6\]/g, 'bg-slate-50');
    // For cards/panels where we previously used bg-white, let's inject calm styling
    // We'll catch them individually or replace the borders
    
    // Text
    content = content.replace(/text-\[#212121\]/g, 'text-slate-900');
    content = content.replace(/text-\[#878787\]/g, 'text-slate-500');
    
    // Borders
    content = content.replace(/border-\[#e0e0e0\]/g, 'border-slate-200');
    content = content.replace(/border-2 border-slate-200/g, 'border border-slate-200 shadow-sm rounded-xl');
    content = content.replace(/border-b-2 border-slate-200/g, 'border-b border-slate-200');
    content = content.replace(/border-r-2 border-slate-200/g, 'border-r border-slate-200');
    content = content.replace(/border-t-2 border-slate-200/g, 'border-t border-slate-200');

    // Buttons / Accents
    content = content.replace(/bg-\[#2874f0\]/g, 'bg-blue-600');
    content = content.replace(/hover:bg-\[#1a5dc8\]/g, 'hover:bg-blue-700');
    content = content.replace(/text-\[#2874f0\]/g, 'text-blue-600');
    content = content.replace(/border-\[#2874f0\]/g, 'border-blue-600');
    
    content = content.replace(/bg-\[#388e3c\]/g, 'bg-emerald-600');
    content = content.replace(/hover:bg-\[#2d7031\]/g, 'hover:bg-emerald-700');
    content = content.replace(/text-\[#388e3c\]/g, 'text-emerald-600');
    
    content = content.replace(/bg-\[#ff6161\]/g, 'bg-rose-600');
    content = content.replace(/text-\[#ff6161\]/g, 'text-rose-600');
    content = content.replace(/hover:bg-\[#e05050\]/g, 'hover:bg-rose-700');

    // Button specific cleanup (add rounded corners, soft shadow, remove brutalist transitions)
    content = content.replace(/transition-none rounded-none/g, 'transition-all rounded-xl shadow-sm');
    content = content.replace(/transition-none/g, 'transition-all');
    content = content.replace(/rounded-none/g, 'rounded-xl');

    // 2. TYPOGRAPHY & COGNITIVE LOAD
    // Remove the aggressive screaming uppercase and monospace globally from core layouts
    content = content.replace(/tracking-widest uppercase/g, 'font-medium');
    content = content.replace(/font-mono/g, ''); 
    
    // Make headers look softer and more professional
    content = content.replace(/font-bold tracking-widest uppercase/g, 'font-semibold');
    content = content.replace(/font-bold font-medium/g, 'font-semibold tracking-tight');
    content = content.replace(/text-3xl font-bold/g, 'text-3xl font-bold tracking-tight');
    content = content.replace(/text-4xl font-bold/g, 'text-4xl font-extrabold tracking-tight text-slate-900');
    content = content.replace(/text-2xl font-bold/g, 'text-2xl font-semibold tracking-tight text-slate-900');
    
    // Clean up overlapping classes from regex
    content = content.replace(/font-semibold font-medium/g, 'font-semibold');
    content = content.replace(/font-medium font-medium/g, 'font-medium');

    // Increase small text slightly for readability (caretakers need clear vision)
    content = content.replace(/text-\[10px\]/g, 'text-xs');
    
    // 3. UI SPECIFICS 
    // Auth Page
    content = content.replace(/AUTHORIZED PERSONNEL ONLY/g, 'Caretaker Portal');
    content = content.replace(/EMAIL DESIGNATION/g, 'Email Address');
    content = content.replace(/ACCESS PHRASE/g, 'Password');
    content = content.replace(/AUTHENTICATING.../g, 'Authenticating...');
    content = content.replace(/INITIALIZE CREDENTIALS/g, 'Sign Up');
    content = content.replace(/ESTABLISH CONNECTION/g, 'Secure Log In');
    content = content.replace(/CREDENTIALS EXIST\? RETURN TO LOGIN/g, 'Already have an account? Log In');
    content = content.replace(/REQUIRE ACCESS\? ACQUIRE CREDENTIALS/g, 'Need an account? Sign Up');
    
    // Padding/Spacing adjustments for "softness"
    content = content.replace(/p-6/g, 'p-6 rounded-2xl');
    content = content.replace(/p-8/g, 'p-8 rounded-2xl shadow-xl border border-slate-100');

    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Applied Calm Healthcare UX paradigms.');
