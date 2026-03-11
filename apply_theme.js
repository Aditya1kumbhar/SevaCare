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
    
    // Backup content just in case
    fs.writeFileSync(filePath + '.bak', content, 'utf8');
    
    // Backgrounds and Panels
    content = content.replace(/bg-black/g, 'bg-[#f1f3f6]');
    content = content.replace(/bg-zinc-950/g, 'bg-[#f1f3f6]');
    content = content.replace(/bg-zinc-900/g, 'bg-white');
    
    // Text colors (global)
    // Replace text-white with Kundan dark text
    content = content.replace(/text-white/g, 'text-[#212121]');
    
    // Muted texts
    content = content.replace(/text-zinc-600/g, 'text-[#878787]');
    content = content.replace(/text-zinc-500/g, 'text-[#878787]');
    content = content.replace(/text-zinc-400/g, 'text-[#878787]');
    content = content.replace(/text-zinc-300/g, 'text-[#878787]');
    
    // Borders
    content = content.replace(/border-zinc-900/g, 'border-[#e0e0e0]');
    content = content.replace(/border-zinc-800/g, 'border-[#e0e0e0]');
    
    // Now revert button text back to white
    // Common button patterns
    content = content.replace(/text-\[#212121\] disabled:bg-zinc-800/g, 'text-white disabled:bg-[#e0e0e0]');
    content = content.replace(/text-\[#212121\] flex items-center gap-2/g, 'text-white flex items-center gap-2');
    
    // Primary Actions (Purple -> Flipkart Blue)
    content = content.replace(/bg-purple-600/g, 'bg-[#2874f0]');
    content = content.replace(/hover:bg-purple-700/g, 'hover:bg-[#1a5dc8]');
    content = content.replace(/text-purple-500/g, 'text-[#2874f0]');
    content = content.replace(/border-purple-500/g, 'border-[#2874f0]');
    
    // Secondary Actions (Emerald -> Flipkart Green)
    content = content.replace(/bg-emerald-600/g, 'bg-[#388e3c]');
    content = content.replace(/hover:bg-emerald-500/g, 'hover:bg-[#2d7031]');
    content = content.replace(/text-emerald-500/g, 'text-[#388e3c]');
    
    // Destructive Actions (Red)
    content = content.replace(/bg-red-600/g, 'bg-[#ff6161]');
    content = content.replace(/text-red-500/g, 'text-[#ff6161]');
    
    // Specific fix for forms/buttons that got dark text where they shouldn't
    content = content.replace(/bg-\[#2874f0\] hover:bg-\[#1a5dc8\] text-\[#212121\]/g, 'bg-[#2874f0] hover:bg-[#1a5dc8] text-white');
    content = content.replace(/bg-\[#388e3c\] hover:bg-\[#2d7031\] text-\[#212121\]/g, 'bg-[#388e3c] hover:bg-[#2d7031] text-white');
    content = content.replace(/bg-\[#ff6161\] hover:bg-red-700 text-\[#212121\]/g, 'bg-[#ff6161] hover:bg-[#e05050] text-white');
    content = content.replace(/bg-\[#ff6161\] text-\[#212121\]/g, 'bg-[#ff6161] text-white');
    
    // Auth page specific
    content = content.replace(/bg-white hover:bg-zinc-200 text-black/g, 'bg-[#2874f0] hover:bg-[#1a5dc8] text-white');
    
    // Fix Dashboard Layout Logo + Email
    content = content.replace(/text-\[#212121\] tracking-widest uppercase/g, 'text-[#2874f0] tracking-widest uppercase');
    
    // Theme references
    content = content.replace(/CLINICAL BUILD/g, 'ENTERPRISE BUILD');
    content = content.replace(/CLINICAL UI/g, 'ENTERPRISE UI');
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Theming application with Flipkart/Kundan colors complete.');
