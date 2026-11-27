import { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  MessageCircle,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { parseWhatsAppRawText, type ParsedWhatsAppContact } from '../../utils/otpAndImporter';

export function WhatsAppMemberImporterPanel() {
  const { appearance, users, registerUser, showToast } = useStore();

  const [rawText, setRawText] = useState('');
  const [parsedContacts, setParsedContacts] = useState<ParsedWhatsAppContact[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleParse = () => {
    if (!rawText.trim()) {
      showToast('Please paste some text from your WhatsApp group first.');
      return;
    }
    const contacts = parseWhatsAppRawText(rawText);
    setParsedContacts(contacts);
    showToast(`Parsed ${contacts.length} contact(s) from WhatsApp text.`);
  };

  const handleImportAll = async () => {
    if (parsedContacts.length === 0) return;
    setIsImporting(true);

    let importedCount = 0;

    for (let idx = 0; idx < parsedContacts.length; idx++) {
      const contact = parsedContacts[idx];
      const generatedEmail =
        contact.email ||
        (contact.phone
          ? `wa.${contact.phone.replace(/\D/g, '')}@digitalwealthcreators.ng`
          : `student.${Date.now()}.${idx}@digitalwealthcreators.ng`);

      const contactName = contact.name || (contact.phone ? `Member ${contact.phone}` : `Student ${idx + 1}`);

      // Check if already registered
      const exists = users.some((u) => u.email.toLowerCase() === generatedEmail.toLowerCase());
      if (!exists) {
        const res = await registerUser(
          contactName,
          generatedEmail,
          'welcome2026', // Initial default password, member can update anytime
          'customer',
          true
        );
        if (res.ok) {
          importedCount += 1;
        }
      }
    }

    if (importedCount > 0) {
      showToast(`Successfully enrolled ${importedCount} student accounts!`);
    } else {
      showToast('All contacts are already enrolled or registered.');
    }

    setIsImporting(false);
  };

  const communityInviteUrl = 'https://digitalwealthcreators.org.ng/community';

  const migrationBroadcastText = `🚀 *Important Update: We are moving to the ${appearance.brandName} Platform!*

Hello everyone! To give you structured access to our video training, recordings, discussion boards, and the new *AI VIP Prompt Vault*, we are moving our community out of WhatsApp.

👉 *Claim your free VIP Member access here:*
${communityInviteUrl}

(Tap the link, register your name & email, and tap "Add to Home Screen" to install it directly on your phone like an app!)`;

  const handleCopyBroadcast = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(migrationBroadcastText);
      setCopiedMessage(true);
      showToast('Copied WhatsApp migration message to clipboard!');
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  const handleCopyLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(communityInviteUrl);
      setCopiedLink(true);
      showToast('Copied platform community link!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleExportCsv = () => {
    if (parsedContacts.length === 0) return;
    const header = 'Name,Phone,Email\n';
    const rows = parsedContacts
      .map((c) => `"${c.name || ''}","${c.phone || ''}","${c.email || ''}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `whatsapp_students_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded contacts CSV file.');
  };

  return (
    <div className="bg-white border border-[#c3c4c7] p-5 rounded-sm space-y-6">
      <div>
        <div className="flex items-center gap-2 text-[#0a192f]">
          <MessageCircle className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold">
            WhatsApp Group & Student Seamless Importer
          </h2>
        </div>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          You don't need any CSV conversion skills! Simply open WhatsApp, copy your members or chat text,
          and paste it directly below. Our parser will extract names and phone numbers automatically.
        </p>
      </div>

      {/* Step 1: 1-Click WhatsApp Broadcast Message */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Fastest Migration: Post Ready-Made Invitation in WhatsApp
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopyBroadcast}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer transition-colors"
          >
            {copiedMessage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMessage ? 'Copied Message!' : 'Copy WhatsApp Post'}</span>
          </button>
        </div>
        <pre className="text-xs text-slate-700 bg-white p-3 rounded border border-emerald-200 whitespace-pre-wrap font-sans">
          {migrationBroadcastText}
        </pre>
      </div>

      {/* Step 2: Paste Raw WhatsApp Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="wa-raw-text" className="block text-xs font-bold text-slate-700">
            Paste Copied WhatsApp Text or Member Roster:
          </label>
          <span className="text-[11px] text-slate-500">
            Supports phone numbers (+234...), names, and emails
          </span>
        </div>

        <textarea
          id="wa-raw-text"
          rows={6}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Example: Paste text directly from WhatsApp:
+234 803 471 0699 ~Chidi
+234 901 234 5678 - Amaka
student@example.com
08031234567
Or simply paste full chat exports...`}
          className="w-full p-3 text-xs font-mono border border-slate-300 rounded-md focus:outline-none focus:border-[#d4af37]"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleParse}
            className="px-4 py-2 text-xs font-bold bg-[#0a192f] text-white rounded hover:bg-[#112240] cursor-pointer"
          >
            Parse WhatsApp Contacts
          </button>

          {parsedContacts.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 rounded cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to CSV ({parsedContacts.length})</span>
              </button>

              <button
                type="button"
                disabled={isImporting}
                onClick={handleImportAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#d4af37] text-[#0a192f] hover:bg-[#e5bf45] rounded cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Enroll All as Registered Members</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Parsed Contacts Preview Table */}
      {parsedContacts.length > 0 && (
        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Parsed Members ({parsedContacts.length})
            </span>
            <span className="text-[11px] text-slate-500">Ready for automated enrollment</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 sticky top-0">
                <tr>
                  <th className="p-2.5 font-semibold">#</th>
                  <th className="p-2.5 font-semibold">Name</th>
                  <th className="p-2.5 font-semibold">Phone</th>
                  <th className="p-2.5 font-semibold">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedContacts.map((contact, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-medium text-slate-900">
                      {contact.name || <span className="text-slate-400 italic">Learner</span>}
                    </td>
                    <td className="p-2.5 font-mono text-slate-700">{contact.phone || '—'}</td>
                    <td className="p-2.5 font-mono text-slate-700">{contact.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
