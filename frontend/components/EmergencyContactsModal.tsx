"use client";

import { useState } from "react";

interface Contact {
  name: string;
  phone: string;
  relationship: string;
}

interface Props {
  isOpen: boolean;
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
  onRemoveContact: (index: number) => void;
  onClose: () => void;
}

export default function EmergencyContactsModal({
  isOpen,
  contacts,
  onAddContact,
  onRemoveContact,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    onAddContact({ name, phone, relationship: relationship || "Family" });
    setName("");
    setPhone("");
    setRelationship("");
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-brand-danger text-lg">📞</span>
            <h3 className="font-bold text-sm tracking-wide text-brand-text uppercase">
              Emergency Contacts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-brand-muted text-xs flex items-center justify-center transition-all active:scale-95"
            aria-label="Close contacts list"
          >
            ✕
          </button>
        </div>

        {/* Existing Contacts List */}
        <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
            Contact Registry ({contacts.length})
          </span>
          {contacts.length === 0 ? (
            <p className="text-xs text-brand-subtle italic py-2 text-center">
              No contacts registered. Register contacts by voice or form.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {contacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="bg-white/40 border border-white/5 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-brand-text">
                      {contact.name} ({contact.relationship})
                    </span>
                    <span className="text-[10px] text-brand-muted font-mono">
                      {contact.phone}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveContact(idx)}
                    className="text-[10px] font-black text-brand-danger hover:underline uppercase tracking-wider px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Contact Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
            Register New Contact
          </span>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/30 border border-white/20 rounded-xl px-3 py-2 text-xs text-brand-text placeholder-brand-subtle focus:outline-none focus:border-brand-accent transition-all"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-white/30 border border-white/20 rounded-xl px-3 py-2 text-xs text-brand-text placeholder-brand-subtle focus:outline-none focus:border-brand-accent transition-all"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3 items-center">
            <input
              type="text"
              placeholder="Relationship (e.g. Spouse)"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="bg-white/30 border border-white/20 rounded-xl px-3 py-2 text-xs text-brand-text placeholder-brand-subtle focus:outline-none focus:border-brand-accent transition-all"
            />
            <button
              type="submit"
              className="bg-brand-accent hover:bg-brand-accentHover text-white font-bold text-xs uppercase tracking-widest py-2 rounded-xl active:scale-95 transition-all shadow-md shadow-brand-accent/25 border border-white/10"
            >
              Add Contact
            </button>
          </div>
        </form>

        <div className="text-[10px] text-brand-muted leading-relaxed mt-1 p-3 bg-brand-accent/5 border border-brand-accent/15 rounded-2xl">
          💡 <span className="font-bold">Voice Command:</span> Say{" "}
          <span className="italic font-bold">"add emergency contact [name]"</span> to register quickly.
        </div>
      </div>
    </div>
  );
}
