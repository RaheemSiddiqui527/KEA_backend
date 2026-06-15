import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function run() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log("Connected to database.");

  // Fetch 100 users for testing Excel generation
  const allMembers = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .limit(100)
    .select("name email role memberId membershipStatus profile createdAt")
    .lean();

  console.log(`Fetched ${allMembers.length} members for test.`);
  
  const pendingData = allMembers.filter(m => m.membershipStatus === 'pending');
  const approvedData = allMembers.filter(m => m.membershipStatus === 'active');
  
  console.log(`Pending: ${pendingData.length}, Approved: ${approvedData.length}`);

  const formatMemberForExcel = (m) => ({
    'Member ID': m.memberId || 'N/A',
    'Name': m.name || '',
    'Email': m.email || '',
    'Role': m.role || 'user',
    'Category': m.profile?.category || 'Not specified',
    'Headline': m.profile?.headline || 'N/A',
    'Location': m.profile?.location || 'N/A',
    'Native Address from Kokan': m.profile?.nativeAddition || 'N/A',
    'Phone': m.profile?.phone || 'N/A',
    'Bio': m.profile?.bio || 'N/A',
    'Join Date': m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'N/A',
    'Status': m.membershipStatus || ''
  });

  const pendingRows = pendingData.map(formatMemberForExcel);
  const approvedRows = approvedData.map(formatMemberForExcel);

  const wb = XLSX.utils.book_new();
  const wsPending = XLSX.utils.json_to_sheet(pendingRows);
  const wsApproved = XLSX.utils.json_to_sheet(approvedRows);

  XLSX.utils.book_append_sheet(wb, wsPending, 'Pending Members');
  XLSX.utils.book_append_sheet(wb, wsApproved, 'Approved Members');

  // Write to buffer and read it back
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const readWb = XLSX.read(buf, { type: 'buffer' });

  console.log("Workbook sheets:", readWb.SheetNames);
  for (const sheetName of readWb.SheetNames) {
    const sheet = readWb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`Sheet "${sheetName}" has ${data.length} rows.`);
    if (data.length > 0) {
      console.log("First row example:", data[0]);
    }
  }

  await mongoose.disconnect();
}

run();
