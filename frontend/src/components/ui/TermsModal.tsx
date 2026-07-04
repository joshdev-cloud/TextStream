/**
 * TermsModal — Comprehensive, legal-ready Terms and Conditions modal.
 *
 * Covers: acceptance of terms, service description, AI use disclaimers,
 * acceptable use, IP, privacy, data processing, liability, and more.
 *
 * Fully scrollable with a clickable table of contents and responsive design.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronUp, FileText, Shield, Scale } from "lucide-react";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms" },
  { id: "description", title: "2. Description of Service" },
  { id: "accounts", title: "3. Account Registration & Security" },
  { id: "ai-content", title: "4. AI-Generated Content" },
  { id: "acceptable-use", title: "5. Acceptable Use Policy" },
  { id: "ip", title: "6. Intellectual Property" },
  { id: "user-content", title: "7. User-Uploaded Content" },
  { id: "privacy", title: "8. Data Privacy & Collection" },
  { id: "ai-data", title: "9. AI Data Processing" },
  { id: "third-party", title: "10. Third-Party Services" },
  { id: "availability", title: "11. Service Availability" },
  { id: "liability", title: "12. Limitation of Liability" },
  { id: "indemnification", title: "13. Indemnification" },
  { id: "termination", title: "14. Termination" },
  { id: "governing-law", title: "15. Governing Law" },
  { id: "changes", title: "16. Changes to Terms" },
  { id: "contact", title: "17. Contact Information" },
];

export function TermsModal({ open, onClose }: TermsModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Scroll tracking ───────────────────────────────────────── */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollTop(el.scrollTop > 300);

    // Find active section
    const sectionEls = el.querySelectorAll("[data-section]");
    let current = "";
    sectionEls.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const containerRect = el.getBoundingClientRect();
      if (rect.top - containerRect.top < 120) {
        current = section.getAttribute("data-section") || "";
      }
    });
    setActiveSection(current);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !open) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [open, handleScroll]);

  /* ── Scroll to section ─────────────────────────────────────── */
  const scrollToSection = (id: string) => {
    const el = scrollRef.current?.querySelector(`[data-section="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Escape key ────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-border/50 shadow-2xl"
        style={{
          background: "var(--glass-strong-bg)",
          backdropFilter: "blur(28px) saturate(160%)",
          animation: "termsSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-glow/15">
              <Scale className="w-4.5 h-4.5 text-amber-glow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Terms and Conditions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last updated: June 30, 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: TOC sidebar (desktop) + content */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* TOC sidebar — hidden on mobile */}
          <nav className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border/20 py-4 px-3 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Contents</p>
            {SECTIONS.map(({ id, title }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`text-left text-xs py-1.5 px-3 rounded-lg transition-all cursor-pointer truncate ${
                  activeSection === id
                    ? "text-amber-glow bg-amber-glow/10 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                {title}
              </button>
            ))}
          </nav>

          {/* Scrollable content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 terms-content">

            {/* Preamble */}
            <div className="mb-8 p-4 rounded-2xl bg-secondary/20 border border-border/20">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-lavender mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">TextStream Terms of Service</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Please read these Terms and Conditions ("Terms", "Terms of Service") carefully before using the TextStream
                    platform ("Service", "Platform") operated by TextStream ("us", "we", "our"). Your access to and use of the
                    Service is conditioned on your acceptance of and compliance with these Terms.
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Section 1: Acceptance ─────────────────────── */}
            <section data-section="acceptance" className="mb-8">
              <h3 className="terms-heading">1. Acceptance of Terms</h3>
              <p className="terms-paragraph">
                By creating an account, accessing, or using the TextStream platform, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service and all applicable laws and regulations. If you do
                not agree with any part of these Terms, you must not use the Service.
              </p>
              <p className="terms-paragraph">
                These Terms constitute a legally binding agreement between you ("User", "you", "your") and TextStream. Your
                continued use of the Platform after any modifications to these Terms constitutes acceptance of those changes.
              </p>
              <p className="terms-paragraph">
                If you are using the Service on behalf of an organization, you represent and warrant that you have the authority
                to bind that organization to these Terms, and "you" and "your" will refer to that organization.
              </p>
            </section>

            {/* ─── Section 2: Description ────────────────────── */}
            <section data-section="description" className="mb-8">
              <h3 className="terms-heading">2. Description of Service</h3>
              <p className="terms-paragraph">
                TextStream is an AI-powered study and research platform that provides users with tools to upload, organize, and
                interact with educational documents and materials. The Service includes, but is not limited to:
              </p>
              <ul className="terms-list">
                <li>Document ingestion and processing (PDF, text, and other supported formats)</li>
                <li>AI-assisted summarization, analysis, and comprehension tools</li>
                <li>Conversational AI tutoring and question-answering capabilities</li>
                <li>Quiz generation and study mode features</li>
                <li>Document organization, annotation, and note-taking tools</li>
                <li>Collaborative study workspace features</li>
              </ul>
              <p className="terms-paragraph">
                The Service is provided for educational and personal research purposes. TextStream reserves the right to modify,
                suspend, or discontinue any aspect of the Service at any time, with or without notice.
              </p>
            </section>

            {/* ─── Section 3: Accounts ───────────────────────── */}
            <section data-section="accounts" className="mb-8">
              <h3 className="terms-heading">3. Account Registration & Security</h3>
              <p className="terms-paragraph">
                To access certain features of the Service, you must create an account. When registering, you agree to:
              </p>
              <ul className="terms-list">
                <li>Provide accurate, current, and complete information during the registration process</li>
                <li>Maintain and promptly update your account information to keep it accurate and complete</li>
                <li>Maintain the security and confidentiality of your login credentials</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify TextStream immediately of any unauthorized use of your account</li>
              </ul>
              <p className="terms-paragraph">
                <strong>Age Requirement:</strong> You must be at least 13 years of age to use the Service. If you are under 18, you
                represent that you have your parent's or legal guardian's permission to use the Service. We reserve the right
                to terminate accounts that we discover are operated by users under the minimum age requirement.
              </p>
              <p className="terms-paragraph">
                <strong>Account Security:</strong> You are responsible for safeguarding your password and for any activities or
                actions under your account. TextStream will not be liable for any loss or damage arising from your failure to
                comply with this security obligation. We strongly recommend using a unique, strong password and enabling any
                available multi-factor authentication features.
              </p>
            </section>

            {/* ─── Section 4: AI Content ─────────────────────── */}
            <section data-section="ai-content" className="mb-8">
              <h3 className="terms-heading">4. AI-Generated Content</h3>
              <div className="p-4 rounded-xl bg-amber-glow/8 border border-amber-glow/15 mb-4">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-amber-glow mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed">
                    <strong className="text-amber-glow">Important Disclaimer:</strong> AI-generated content is assistive in nature
                    and should not be treated as authoritative, professional, or definitive advice.
                  </p>
                </div>
              </div>
              <p className="terms-paragraph">
                TextStream utilizes artificial intelligence and machine learning technologies to generate summaries, answers,
                quizzes, analyses, and other content based on your uploaded documents and queries. By using these features, you
                acknowledge and agree that:
              </p>
              <ul className="terms-list">
                <li>
                  <strong>No Guarantee of Accuracy:</strong> AI-generated content may contain errors, inaccuracies, omissions, or
                  hallucinated information. TextStream does not warrant the accuracy, completeness, reliability, or suitability
                  of any AI-generated output.
                </li>
                <li>
                  <strong>Not Professional Advice:</strong> AI outputs do not constitute legal, medical, financial, academic, or any
                  other form of professional advice. You should always consult qualified professionals for such matters.
                </li>
                <li>
                  <strong>User Responsibility:</strong> You are solely responsible for verifying, fact-checking, and evaluating all
                  AI-generated content before relying on it for any purpose, including academic submissions, professional work,
                  or personal decisions.
                </li>
                <li>
                  <strong>Academic Integrity:</strong> Use of AI-generated content in academic settings must comply with your
                  educational institution's policies on AI-assisted work, academic honesty, and plagiarism. TextStream is not
                  responsible for any violations of academic integrity policies.
                </li>
                <li>
                  <strong>Content Variability:</strong> AI outputs may vary between sessions and may produce different results for
                  the same or similar inputs. This variability is inherent to the technology and does not indicate a defect.
                </li>
              </ul>
            </section>

            {/* ─── Section 5: Acceptable Use ─────────────────── */}
            <section data-section="acceptable-use" className="mb-8">
              <h3 className="terms-heading">5. Acceptable Use Policy</h3>
              <p className="terms-paragraph">
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul className="terms-list">
                <li>Use the Service in any way that violates any applicable local, state, national, or international law or regulation</li>
                <li>Upload, transmit, or distribute any content that is unlawful, harmful, threatening, abusive, harassing,
                  defamatory, vulgar, obscene, or otherwise objectionable</li>
                <li>Upload content that infringes upon the intellectual property rights, privacy rights, or any other rights of any third party</li>
                <li>Attempt to gain unauthorized access to the Service, other accounts, computer systems, or networks connected
                  to the Service through hacking, password mining, or any other means</li>
                <li>Use the Service to transmit any worms, viruses, Trojan horses, or other malicious code</li>
                <li>Interfere with, disrupt, or create an undue burden on the Service or the networks connected to the Service</li>
                <li>Use any automated system, including robots, spiders, scrapers, or data mining tools, to access the Service
                  for any purpose without our express written permission</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code or underlying
                  algorithms of the Service</li>
                <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity</li>
                <li>Use the AI features to generate content that promotes violence, discrimination, illegal activities, or harm</li>
                <li>Resell, redistribute, or sublicense access to the Service without prior written authorization</li>
                <li>Use the Service to build a competing product or service</li>
              </ul>
              <p className="terms-paragraph">
                TextStream reserves the right to investigate and take appropriate legal action against anyone who, in
                TextStream's sole discretion, violates this provision, including, without limitation, removing offending content,
                suspending or terminating the account of such violators, and reporting them to law enforcement authorities.
              </p>
            </section>

            {/* ─── Section 6: IP ─────────────────────────────── */}
            <section data-section="ip" className="mb-8">
              <h3 className="terms-heading">6. Intellectual Property</h3>
              <p className="terms-paragraph">
                <strong>Platform Ownership:</strong> The Service, including its original content, features, functionality, design,
                graphics, logos, icons, and the underlying source code and algorithms (excluding user-uploaded content), is and
                shall remain the exclusive property of TextStream and its licensors. The Service is protected by copyright,
                trademark, trade secret, and other intellectual property laws.
              </p>
              <p className="terms-paragraph">
                <strong>Trademarks:</strong> The TextStream name, logo, and all related names, logos, product and service names,
                designs, and slogans are trademarks of TextStream. You must not use such marks without the prior written
                permission of TextStream.
              </p>
              <p className="terms-paragraph">
                <strong>User License:</strong> Subject to your compliance with these Terms, TextStream grants you a limited,
                non-exclusive, non-transferable, revocable license to access and use the Service for your personal,
                non-commercial, educational purposes.
              </p>
            </section>

            {/* ─── Section 7: User Content ───────────────────── */}
            <section data-section="user-content" className="mb-8">
              <h3 className="terms-heading">7. User-Uploaded Content</h3>
              <p className="terms-paragraph">
                <strong>Ownership:</strong> You retain all rights to the documents, files, and other materials you upload to the
                Service ("User Content"). TextStream does not claim ownership over your User Content.
              </p>
              <p className="terms-paragraph">
                <strong>License Grant:</strong> By uploading content to the Service, you grant TextStream a limited,
                non-exclusive, worldwide, royalty-free license to use, process, store, and display your User Content solely
                for the purpose of providing, maintaining, and improving the Service for you. This license terminates when you
                delete your User Content or your account, except as may be required for backup or legal compliance purposes.
              </p>
              <p className="terms-paragraph">
                <strong>User Responsibility:</strong> You represent and warrant that: (a) you own or have the necessary rights to
                upload your User Content; (b) your User Content does not infringe upon the intellectual property, privacy, or
                any other rights of any third party; and (c) your User Content complies with all applicable laws and
                regulations. TextStream is not responsible for the content, legality, or accuracy of any User Content.
              </p>
              <p className="terms-paragraph">
                <strong>Content Removal:</strong> TextStream reserves the right to remove any User Content that violates these
                Terms or is otherwise objectionable, at its sole discretion and without prior notice.
              </p>
            </section>

            {/* ─── Section 8: Privacy ────────────────────────── */}
            <section data-section="privacy" className="mb-8">
              <h3 className="terms-heading">8. Data Privacy & Collection</h3>
              <p className="terms-paragraph">
                TextStream is committed to protecting your privacy. We collect and process information in accordance with
                applicable data protection laws. The following describes our data practices:
              </p>
              <p className="terms-paragraph"><strong>Information We Collect:</strong></p>
              <ul className="terms-list">
                <li><strong>Account Information:</strong> Name, email address, age, gender, and authentication credentials provided during registration</li>
                <li><strong>Usage Data:</strong> Information about how you interact with the Service, including features used, documents processed, session duration, and access patterns</li>
                <li><strong>Device & Technical Data:</strong> Browser type, operating system, IP address, device identifiers, and similar technical information</li>
                <li><strong>User Content:</strong> Documents, files, and materials you upload for processing</li>
                <li><strong>Communication Data:</strong> Any correspondence you send to us, including support requests</li>
              </ul>
              <p className="terms-paragraph"><strong>How We Use Your Information:</strong></p>
              <ul className="terms-list">
                <li>To provide, operate, and maintain the Service</li>
                <li>To personalize your experience and improve our features</li>
                <li>To process and analyze your documents using AI technologies</li>
                <li>To communicate with you about service updates, security alerts, and support matters</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations and enforce our Terms</li>
              </ul>
              <p className="terms-paragraph">
                <strong>Data Retention:</strong> We retain your personal data for as long as your account is active or as needed
                to provide the Service. Upon account deletion, we will delete or anonymize your personal data within 30 days,
                unless retention is required by law or for legitimate business purposes (e.g., fraud prevention, legal compliance).
              </p>
              <p className="terms-paragraph">
                <strong>Data Security:</strong> We implement industry-standard technical and organizational measures to protect
                your data, including encryption in transit and at rest, access controls, and regular security audits. However,
                no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            {/* ─── Section 9: AI Data Processing ─────────────── */}
            <section data-section="ai-data" className="mb-8">
              <h3 className="terms-heading">9. AI Data Processing</h3>
              <p className="terms-paragraph">
                TextStream uses third-party AI models and services to process your documents and queries. By using the
                Service's AI features, you acknowledge and agree to the following:
              </p>
              <ul className="terms-list">
                <li>
                  <strong>Document Processing:</strong> Your uploaded documents may be sent to third-party AI service providers
                  for processing. This includes text extraction, analysis, summarization, and other AI-powered operations.
                </li>
                <li>
                  <strong>No Model Training:</strong> TextStream does not use your documents or personal data to train, fine-tune,
                  or improve AI models. Your data is processed on-demand solely to generate outputs for your use.
                </li>
                <li>
                  <strong>Data Minimization:</strong> We transmit only the minimum data necessary for AI processing. Document
                  content is sent to AI providers in a manner that does not include personally identifiable information unless
                  such information is part of the document content itself.
                </li>
                <li>
                  <strong>Third-Party Processing:</strong> AI processing is performed by third-party providers whose data
                  processing practices are governed by their own terms of service and privacy policies. We select providers
                  that commit to appropriate data protection standards.
                </li>
                <li>
                  <strong>Transient Processing:</strong> AI model providers typically process data transiently and do not retain
                  your document content after processing is complete. However, TextStream cannot guarantee the data handling
                  practices of third-party providers beyond the contractual agreements in place.
                </li>
              </ul>
            </section>

            {/* ─── Section 10: Third-Party ───────────────────── */}
            <section data-section="third-party" className="mb-8">
              <h3 className="terms-heading">10. Third-Party Services</h3>
              <p className="terms-paragraph">
                The Service integrates with and relies upon third-party services, including but not limited to:
              </p>
              <ul className="terms-list">
                <li><strong>Supabase:</strong> For authentication, database, and backend infrastructure</li>
                <li><strong>Google OAuth:</strong> For third-party authentication and sign-in</li>
                <li><strong>AI Model Providers:</strong> For document processing, summarization, and conversational AI capabilities</li>
                <li><strong>Cloud Storage Providers:</strong> For secure document storage and retrieval</li>
              </ul>
              <p className="terms-paragraph">
                Your use of these third-party services is subject to their respective terms of service and privacy policies.
                TextStream is not responsible for the practices, content, or availability of third-party services. We encourage
                you to review the terms and privacy policies of any third-party services you interact with through the Platform.
              </p>
              <p className="terms-paragraph">
                TextStream does not endorse and is not responsible or liable for any content, advertising, products, or other
                materials available through third-party services.
              </p>
            </section>

            {/* ─── Section 11: Availability ──────────────────── */}
            <section data-section="availability" className="mb-8">
              <h3 className="terms-heading">11. Service Availability & Modifications</h3>
              <p className="terms-paragraph">
                TextStream strives to provide reliable and continuous access to the Service. However, you acknowledge that:
              </p>
              <ul className="terms-list">
                <li>The Service may be temporarily unavailable due to maintenance, updates, or technical issues</li>
                <li>TextStream does not guarantee any specific uptime, performance level, or availability</li>
                <li>We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice</li>
                <li>We may impose limits on certain features or restrict access to parts or all of the Service without notice or liability</li>
              </ul>
              <p className="terms-paragraph">
                TextStream shall not be liable to you or any third party for any modification, suspension, or discontinuance of
                the Service or any part thereof.
              </p>
            </section>

            {/* ─── Section 12: Liability ─────────────────────── */}
            <section data-section="liability" className="mb-8">
              <h3 className="terms-heading">12. Limitation of Liability</h3>
              <p className="terms-paragraph">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE"
                BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO,
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="terms-paragraph">
                IN NO EVENT SHALL TEXTSTREAM, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS
                OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="terms-list">
                <li>Your access to or use of (or inability to access or use) the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service, including AI-generated content</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                <li>Errors, inaccuracies, or omissions in AI-generated outputs</li>
                <li>Any reliance on AI-generated content for academic, professional, or personal decisions</li>
              </ul>
              <p className="terms-paragraph">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TEXTSTREAM'S TOTAL LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING
                TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID TO TEXTSTREAM IN THE TWELVE (12) MONTHS
                PRECEDING THE CLAIM, OR ONE HUNDRED US DOLLARS (USD $100), WHICHEVER IS GREATER.
              </p>
            </section>

            {/* ─── Section 13: Indemnification ───────────────── */}
            <section data-section="indemnification" className="mb-8">
              <h3 className="terms-heading">13. Indemnification</h3>
              <p className="terms-paragraph">
                You agree to defend, indemnify, and hold harmless TextStream and its officers, directors, employees, agents,
                licensors, and service providers from and against any claims, liabilities, damages, judgments, awards, losses,
                costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to:
              </p>
              <ul className="terms-list">
                <li>Your violation of these Terms of Service</li>
                <li>Your use of the Service, including any data or content transmitted or received by you</li>
                <li>Your User Content or any content you upload, submit, or transmit through the Service</li>
                <li>Your violation of any third-party rights, including intellectual property or privacy rights</li>
                <li>Your violation of any applicable law, rule, or regulation</li>
                <li>Any claim related to your use of AI-generated content from the Service</li>
              </ul>
            </section>

            {/* ─── Section 14: Termination ───────────────────── */}
            <section data-section="termination" className="mb-8">
              <h3 className="terms-heading">14. Termination</h3>
              <p className="terms-paragraph">
                <strong>By TextStream:</strong> We may terminate or suspend your account and access to the Service immediately,
                without prior notice or liability, for any reason whatsoever, including without limitation if you breach these
                Terms. Upon termination, your right to use the Service will immediately cease.
              </p>
              <p className="terms-paragraph">
                <strong>By You:</strong> You may terminate your account at any time by contacting us or using the account
                deletion features within the Service. Upon your request, we will delete your account and associated data in
                accordance with our data retention policies described in Section 8.
              </p>
              <p className="terms-paragraph">
                <strong>Effect of Termination:</strong> Upon termination, all licenses and rights granted to you under these
                Terms will immediately terminate. Sections that by their nature should survive termination shall survive,
                including but not limited to: ownership provisions, warranty disclaimers, indemnification obligations, and
                limitations of liability.
              </p>
              <p className="terms-paragraph">
                <strong>Data Handling:</strong> Following account termination, we will retain your data for a reasonable period
                (not exceeding 30 days) to allow for account recovery. After this period, your User Content and personal data
                will be permanently deleted, except where retention is required by law.
              </p>
            </section>

            {/* ─── Section 15: Governing Law ─────────────────── */}
            <section data-section="governing-law" className="mb-8">
              <h3 className="terms-heading">15. Governing Law & Dispute Resolution</h3>
              <p className="terms-paragraph">
                These Terms shall be governed by and construed in accordance with the laws of the applicable jurisdiction in
                which TextStream operates, without regard to its conflict of law provisions.
              </p>
              <p className="terms-paragraph">
                Any dispute arising from or relating to these Terms or the Service shall first be attempted to be resolved
                through good-faith negotiation. If the dispute cannot be resolved through negotiation within thirty (30) days,
                either party may pursue resolution through binding arbitration or the appropriate courts of competent
                jurisdiction.
              </p>
              <p className="terms-paragraph">
                You agree that any arbitration or court proceedings shall be limited to the dispute between you and TextStream
                individually. To the full extent permitted by law, (a) no arbitration or court proceedings shall be joined with
                any other proceedings; (b) there is no right or authority for any dispute to be arbitrated on a class-action
                basis; and (c) there is no right or authority for any dispute to be brought in a purported representative
                capacity on behalf of the general public or any other persons.
              </p>
            </section>

            {/* ─── Section 16: Changes ───────────────────────── */}
            <section data-section="changes" className="mb-8">
              <h3 className="terms-heading">16. Changes to Terms</h3>
              <p className="terms-paragraph">
                TextStream reserves the right to modify or replace these Terms at any time at our sole discretion. If a
                revision is material, we will provide at least thirty (30) days' notice prior to any new terms taking effect.
                What constitutes a material change will be determined at our sole discretion.
              </p>
              <p className="terms-paragraph">
                We will notify you of changes through one or more of the following methods: (a) posting the updated Terms on
                the Platform; (b) sending an email to the address associated with your account; or (c) displaying a prominent
                notice within the Service.
              </p>
              <p className="terms-paragraph">
                By continuing to access or use the Service after any revisions become effective, you agree to be bound by the
                revised Terms. If you do not agree to the new Terms, in whole or in part, please stop using the Service and
                delete your account.
              </p>
            </section>

            {/* ─── Section 17: Contact ───────────────────────── */}
            <section data-section="contact" className="mb-8">
              <h3 className="terms-heading">17. Contact Information</h3>
              <p className="terms-paragraph">
                If you have any questions, concerns, or requests regarding these Terms of Service, please contact us at:
              </p>
              <div className="mt-3 p-4 rounded-xl bg-secondary/20 border border-border/20">
                <p className="text-sm text-foreground font-medium">TextStream Support</p>
                <p className="text-xs text-muted-foreground mt-1">Email: support@textstream.app</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  We aim to respond to all inquiries within 48 business hours.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-4 pt-6 border-t border-border/20 text-center">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} TextStream. All rights reserved.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll-to-top FAB */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="absolute bottom-20 right-6 w-9 h-9 rounded-full bg-amber-glow/90 text-white flex items-center justify-center shadow-lg hover:bg-amber-glow transition-all hover:scale-110 active:scale-95 cursor-pointer"
            style={{ animation: "termsSlideUp 0.2s ease-out" }}
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}

        {/* Footer action */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 border-t border-border/30 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-glow to-coral text-white font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer glow-amber"
          >
            I Understand
          </button>
        </div>
      </div>

      {/* Inline styles for modal content */}
      <style>{`
        @keyframes termsSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .terms-heading {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--foreground);
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border);
          scroll-margin-top: 1rem;
        }

        .terms-paragraph {
          font-size: 0.8rem;
          line-height: 1.7;
          color: var(--muted-foreground);
          margin-bottom: 0.75rem;
        }

        .terms-paragraph strong {
          color: var(--foreground);
          font-weight: 600;
        }

        .terms-list {
          list-style: none;
          padding-left: 0;
          margin-bottom: 0.75rem;
        }

        .terms-list li {
          font-size: 0.8rem;
          line-height: 1.7;
          color: var(--muted-foreground);
          padding: 0.3rem 0 0.3rem 1.25rem;
          position: relative;
        }

        .terms-list li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.75rem;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--amber-glow);
          opacity: 0.6;
        }

        .terms-list li strong {
          color: var(--foreground);
          font-weight: 600;
        }

        .terms-content::-webkit-scrollbar {
          width: 6px;
        }

        .terms-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .terms-content::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }

        .terms-content::-webkit-scrollbar-thumb:hover {
          background: var(--muted-foreground);
        }
      `}</style>
    </div>,
    document.body
  );
}
