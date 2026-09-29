import { jsPDF } from 'jspdf';
import { AppSettings, Customer, Transaction } from '../types';
import { formatDatePretty, formatTime12h } from './date';

/**
 * Generates and triggers download of CSV (opens natively in Excel with proper UTF-8 Urdu characters)
 */
export function exportToExcelCSV(
  customer: Customer,
  transactions: Transaction[],
  settings: AppSettings,
  periodTitle: string
) {
  const currency = settings.currency || 'Rs.';

  let totalGave = 0;
  let totalGot = 0;

  // Header rows
  const rows: string[][] = [
    [`"${settings.shopName}"`],
    [`"صاحب دکان / پروپرائیٹر: ${settings.ownerName} | فون: ${settings.shopPhone}"`],
    [`"حساب کتاب برائے کسٹمر: ${customer.name} | رابطہ: ${customer.phone || 'N/A'}"`],
    [`"مدت / Period: ${periodTitle} | تاریخ رپورٹ: ${new Date().toLocaleDateString('ur-PK')}"`],
    [],
    [
      '"شمار (Sr#)"',
      '"تاریخ (Date)"',
      '"وقت (Time)"',
      '"تفصیل / آئٹم (Item Description)"',
      '"قسم (Type)"',
      `"میں نے دیا (You Gave - ${currency})"`,
      `"میں نے لیا (You Got - ${currency})"`,
      `"بقایا بیلنس (Balance - ${currency})"`,
      '"نوٹ / بل حوالہ (Note/Bill#)"'
    ]
  ];

  let running = 0;
  transactions.forEach((tx, idx) => {
    if (tx.type === 'gave') {
      totalGave += tx.amount;
      running += tx.amount;
    } else {
      totalGot += tx.amount;
      running -= tx.amount;
    }

    const typeLabel = tx.type === 'gave' ? 'دیا (Gave)' : 'لیا (Got)';
    const gaveAmount = tx.type === 'gave' ? tx.amount.toString() : '0';
    const gotAmount = tx.type === 'got' ? tx.amount.toString() : '0';
    const cleanItem = (tx.itemName || '').replace(/"/g, '""');
    const cleanNote = (tx.note || '').replace(/"/g, '""');

    rows.push([
      `"${idx + 1}"`,
      `"${tx.date}"`,
      `"${tx.time || ''}"`,
      `"${cleanItem}"`,
      `"${typeLabel}"`,
      `"${gaveAmount}"`,
      `"${gotAmount}"`,
      `"${running}"`,
      `"${cleanNote}"`
    ]);
  });

  const netBalance = totalGave - totalGot;
  const balanceStatus =
    netBalance > 0
      ? `لینے ہیں (You'll Receive: ${currency} ${netBalance.toLocaleString()})`
      : netBalance < 0
      ? `دینے ہیں (You'll Pay: ${currency} ${Math.abs(netBalance).toLocaleString()})`
      : 'برابر (Settled)';

  rows.push([]);
  rows.push(['"--- خلاصہ حساب (Summary) ---"']);
  rows.push([`"کل دیا گیا (Total Gave)"`, `"${currency} ${totalGave.toLocaleString()}"`]);
  rows.push([`"کل وصول شدہ (Total Got)"`, `"${currency} ${totalGot.toLocaleString()}"`]);
  rows.push([`"صافی بقایا (Net Balance)"`, `"${currency} ${netBalance.toLocaleString()}"`, `"${balanceStatus}"`]);

  // CSV with UTF-8 BOM so Microsoft Excel renders Urdu & English characters correctly
  const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (customer.name || 'Khata').replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeName}_Hisab_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates clean formatted PDF statement using jsPDF
 */
export function exportToPDF(
  customer: Customer,
  transactions: Transaction[],
  settings: AppSettings,
  periodTitle: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = settings.currency || 'Rs.';
  let totalGave = 0;
  let totalGot = 0;

  // Emerald Top Header Banner
  doc.setFillColor(6, 95, 70); // #065f46
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName || 'DIGITAL KHATA', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Proprietor: ${settings.ownerName} | Contact: ${settings.shopPhone} | ${settings.shopAddress}`,
    14,
    22
  );
  doc.text(`Official Ledger Statement | Generated: ${new Date().toLocaleString()}`, 14, 27);

  // Customer & Period Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, 37, 182, 22, 2, 2, 'F');

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Customer / Party: ${customer.name}`, 18, 44);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Phone: ${customer.phone || 'N/A'} | City: ${customer.city || 'N/A'}`, 18, 51);
  doc.text(`Statement Period: ${periodTitle}`, 18, 56);

  // Table Header
  let y = 66;
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, 182, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 17, y + 5.5);
  doc.text('Date & Time', 25, y + 5.5);
  doc.text('Item Description / Details', 62, y + 5.5);
  doc.text(`You Gave (${currency})`, 120, y + 5.5);
  doc.text(`You Got (${currency})`, 150, y + 5.5);
  doc.text(`Balance (${currency})`, 178, y + 5.5);

  y += 8;

  let running = 0;
  doc.setFont('helvetica', 'normal');

  transactions.forEach((tx, idx) => {
    // Check if new page needed
    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    if (tx.type === 'gave') {
      totalGave += tx.amount;
      running += tx.amount;
    } else {
      totalGot += tx.amount;
      running -= tx.amount;
    }

    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y, 182, 8, 'F');
    }

    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8);

    doc.text(String(idx + 1), 17, y + 5.5);
    doc.text(`${tx.date} ${tx.time || ''}`, 25, y + 5.5);

    // Truncate long descriptions
    const itemText = (tx.itemName.length > 32 ? tx.itemName.slice(0, 30) + '..' : tx.itemName) + (tx.note ? ` (${tx.note.slice(0, 20)})` : '');
    doc.text(itemText, 62, y + 5.5);

    // Gave (Red-ish if >0)
    if (tx.type === 'gave') {
      doc.setTextColor(185, 28, 28);
      doc.text(tx.amount.toLocaleString(), 120, y + 5.5);
      doc.setTextColor(156, 163, 175);
      doc.text('-', 155, y + 5.5);
    } else {
      doc.setTextColor(156, 163, 175);
      doc.text('-', 125, y + 5.5);
      doc.setTextColor(4, 120, 87);
      doc.text(tx.amount.toLocaleString(), 150, y + 5.5);
    }

    // Running Balance
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.text(running.toLocaleString(), 178, y + 5.5);
    doc.setFont('helvetica', 'normal');

    y += 8;
  });

  const netBalance = totalGave - totalGot;

  // Summary Box at bottom
  if (y > 240) {
    doc.addPage();
    y = 20;
  } else {
    y += 6;
  }

  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.line(14, y, 196, y);
  y += 6;

  // Box for totals
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(100, y, 96, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(100, y, 96, 32, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Gave (Diye):`, 105, y + 8);
  doc.setTextColor(185, 28, 28);
  doc.text(`${currency} ${totalGave.toLocaleString()}`, 160, y + 8);

  doc.setTextColor(71, 85, 105);
  doc.text(`Total Got (Liye):`, 105, y + 15);
  doc.setTextColor(4, 120, 87);
  doc.text(`${currency} ${totalGot.toLocaleString()}`, 160, y + 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Net Balance:`, 105, y + 25);

  if (netBalance > 0) {
    doc.setTextColor(4, 120, 87);
    doc.text(`+ ${currency} ${netBalance.toLocaleString()} (Receive)`, 150, y + 25);
  } else if (netBalance < 0) {
    doc.setTextColor(185, 28, 28);
    doc.text(`- ${currency} ${Math.abs(netBalance).toLocaleString()} (To Pay)`, 150, y + 25);
  } else {
    doc.setTextColor(30, 41, 59);
    doc.text(`${currency} 0 (Settled)`, 160, y + 25);
  }

  // Signature lines
  y += 40;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Customer Signature: __________________', 18, y);
  doc.text('Authorized Signature & Stamp: __________________', 115, y);

  // Download trigger
  const safeName = (customer.name || 'Khata').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${safeName}_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Creates formatted WhatsApp message text
 */
export function buildWhatsAppMessage(
  customer: Customer,
  transactions: Transaction[],
  settings: AppSettings,
  periodTitle: string
): string {
  const currency = settings.currency || 'Rs.';
  let totalGave = 0;
  let totalGot = 0;

  transactions.forEach(t => {
    if (t.type === 'gave') totalGave += t.amount;
    else totalGot += t.amount;
  });

  const net = totalGave - totalGot;
  const statusUrdu =
    net > 0
      ? `آپ کے ذمے واجب الادا بقایا رقم: *${currency} ${net.toLocaleString()}*`
      : net < 0
      ? `ہماری طرف آپ کی رقم باقی ہے: *${currency} ${Math.abs(net).toLocaleString()}*`
      : `حساب بالکل برابر اور کلیئر ہے۔`;

  let msg = `*محترم ${customer.name} صاحب!* 📋\n`;
  msg += `*${settings.shopName}* کی جانب سے حساب کتاب کی تفصیل:\n\n`;
  msg += `🗓️ مدت: *${periodTitle}*\n`;
  msg += `💰 کل دیے گئے سامان/ادھار: *${currency} ${totalGave.toLocaleString()}*\n`;
  msg += `💵 کل وصول شدہ رقم: *${currency} ${totalGot.toLocaleString()}*\n`;
  msg += `---------------------------------\n`;
  msg += `📌 *خلاصہ بقایا:*\n${statusUrdu}\n`;
  if (customer.reminder?.enabled && customer.reminder.nextDueDate) {
    msg += `⏰ *ادائیگی کی مقررہ تاریخ (Due Date):* ${formatDatePretty(customer.reminder.nextDueDate, 'ur')}\n`;
    if (customer.reminder.customNote) {
      msg += `📝 *نوٹ:* ${customer.reminder.customNote}\n`;
    }
  }
  msg += `---------------------------------\n`;
  msg += `کسی بھی استفسار کے لیے رابطہ فرمائیں: ${settings.shopPhone}\n`;
  msg += `شکریہ! 🙏`;

  return msg;
}
