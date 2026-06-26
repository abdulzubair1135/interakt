"use client";

import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/login" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="glass p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-purple-500/20 rounded-2xl">
              <Shield className="w-8 h-8 text-[var(--accent-purple)]" />
            </div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-[var(--accent-pink)]" />
                Data Collection
              </h2>
              <p className="leading-relaxed">
                We collect your university email, name, and profile information to provide a secure and authentic campus social experience. We never sell your data to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-[var(--accent-pink)]" />
                Security
              </h2>
              <p className="leading-relaxed">
                Your data is encrypted using industry-standard protocols. We use JWT tokens for secure authentication and follow best practices to protect your information from unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[var(--accent-pink)]" />
                Your Rights
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Right to access your personal data</li>
                <li>Right to request data deletion</li>
                <li>Right to modify your profile information</li>
                <li>Right to opt-out of notifications</li>
              </ul>
            </section>

            <div className="pt-8 border-t border-white/10 text-sm text-gray-500">
              Last Updated: June 26, 2026. Interakt Team.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
