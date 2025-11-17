const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const csvPath = path.join(__dirname, '..', 'task_template.csv');
const outPath = path.join(__dirname, '..', 'task_template.xlsx');

if (!fs.existsSync(csvPath)) {
  console.error('CSV template not found at', csvPath);
  process.exit(1);
}

const csv = fs.readFileSync(csvPath, 'utf8');
const ws = XLSX.utils.csv_to_sheet(csv);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Learning Plan');
XLSX.writeFile(wb, outPath);
console.log('Wrote', outPath);
