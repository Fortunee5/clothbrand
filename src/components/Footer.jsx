import { Link } from 'react-router-dom'

function InstagramIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 3h-2.5A4.5 4.5 0 0 0 9 7.5V10H6.5v3.5H9V21h3.5v-7.5h3l.5-3.5h-3.5V7.5c0-.83.67-1.5 1.5-1.5H16V3Z" />
    </svg>
  )
}

function TikTokIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 4c.3 2.2 1.8 3.7 4 4" />
      <path d="M16 4v12.2a4 4 0 1 1-3-3.9" />
    </svg>
  )
}

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 21l1.4-3.8A8.5 8.5 0 1 1 8 20.4Z" />
      <path d="M8.7 9.8c.2 2.4 2.1 4.3 4.5 4.5" />
    </svg>
  )
}

function PhoneIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 16.4v3a2 2 0 0 1-2.2 2 18.7 18.7 0 0 1-8.1-2.9 18.4 18.4 0 0 1-5.7-5.7A18.7 18.7 0 0 1 2.1 5.7 2 2 0 0 1 4.1 3.5h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.7a2 2 0 0 1-.4 2.1l-1.3 1.3a15 15 0 0 0 5.7 5.7l1.3-1.3a2 2 0 0 1 2.1-.4c.9.4 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  )
}

function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 7.4 5.1a1 1 0 0 0 1.2 0L20 7" />
    </svg>
  )
}

function MapPinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 10c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function SocialLink({ href, label, children }) {
  return (
    
     <a href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#3A4066] text-[#A6AAC0] transition-colors hover:border-[#C9A24B] hover:bg-[#C9A24B]/10 hover:text-[#C9A24B]"
    >
      {children}
    </a>
  )
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#1B2142] to-[#0D0F1C] pt-14 pb-8 text-[#A6AAC0]">
      <div className="absolute inset-x-0 top-0">
        <div className="h-px bg-[#C9A24B]/60" />
        <div className="mt-[3px] h-px bg-[#C9A24B]/25" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-12 text-center md:text-left">
          <p className="font-serif text-3xl uppercase tracking-[0.25em] text-[#EDE8DD] md:text-4xl">
            TheStyleYouHub
          </p>
          <p className="mt-2 font-serif text-sm italic tracking-wide text-[#C9A24B]">
            Timeless fashion, woven for you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 mb-12">
          <div className="space-y-4">
            <h3 className="inline-block border-b-2 border-[#C9A24B]/70 pb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#EDE8DD]">
              About Us
            </h3>
            <p className="text-sm leading-relaxed text-[#A6AAC0]">
              THESTYLEYOUHUB is your premier destination for timeless fashion.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="inline-block border-b-2 border-[#C9A24B]/70 pb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#EDE8DD]">
              Customer Care
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="#" className="transition-colors hover:text-[#C9A24B]">Contact Us</Link>
              </li>
              <li>
                <Link to="#" className="transition-colors hover:text-[#C9A24B]">Shipping & Returns</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="inline-block border-b-2 border-[#C9A24B]/70 pb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#EDE8DD]">
              Connect
            </h3>
            <div className="flex items-center gap-3 pt-1">
              <SocialLink href="#" label="Instagram">
                <InstagramIcon className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#" label="Facebook">
                <FacebookIcon className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#" label="TikTok">
                <TikTokIcon className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#" label="WhatsApp">
                <WhatsAppIcon className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="inline-block border-b-2 border-[#C9A24B]/70 pb-2 text-sm font-bold uppercase tracking-[0.2em] text-[#EDE8DD]">
              Visit Us
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C9A24B]" />
                <span>14 Adeola Odeku Street, Victoria Island, Lagos, Nigeria</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneIcon className="h-4 w-4 flex-shrink-0 text-[#C9A24B]" />
                <a href="tel:+2348000000000" className="transition-colors hover:text-[#C9A24B]">+234 800 000 0000</a>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneIcon className="h-4 w-4 flex-shrink-0 text-[#C9A24B]" />
                <a href="tel:+233500000000" className="transition-colors hover:text-[#C9A24B]">+233 50 000 0000</a>
              </li>
              <li className="flex items-center gap-2.5">
                <MailIcon className="h-4 w-4 flex-shrink-0 text-[#C9A24B]" />
                <a href="mailto:hello@thestyleyouhub.com" className="transition-colors hover:text-[#C9A24B]">hello@thestyleyouhub.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#2A2F4E] pt-8 text-xs uppercase tracking-widest text-[#6F7390] md:flex-row">
          <div className="mb-0">
            © <Link to="/admin/login" className="transition-colors hover:text-[#C9A24B]">2026 all right reserved</Link>
          </div>
          <div className="flex space-x-4">
            <span>Powered by THESTYLEYOUHUB</span>
          </div>
        </div>
      </div>
    </footer>
  )
}