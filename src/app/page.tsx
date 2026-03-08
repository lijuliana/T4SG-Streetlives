import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Home,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  Heart,
  Users,
  Briefcase,
  Scale,
  Wifi,
  MapPin,
  ChevronRight,
} from "lucide-react";

const services = [
  {
    icon: Home,
    name: "Accommodations",
    description: "A place to stay, shelter, vouchers",
  },
  {
    icon: UtensilsCrossed,
    name: "Food",
    description: "Something to eat",
  },
  {
    icon: Shirt,
    name: "Clothing",
    description: "Something to wear",
  },
  {
    icon: Sparkles,
    name: "Personal Care",
    description: "Shower, restroom, laundry",
  },
  {
    icon: Heart,
    name: "Health",
    description: "Clinic, mental health, medicine",
  },
  {
    icon: Users,
    name: "Family Services",
    description: "Childcare, nursing, check-ups",
  },
  {
    icon: Briefcase,
    name: "Work",
    description: "Jobs, applications, training",
  },
  {
    icon: Scale,
    name: "Legal",
    description: "Lawyers, court services, immigration",
  },
  {
    icon: Wifi,
    name: "Connection",
    description: "Wi-fi, mailbox, computer room",
  },
  {
    icon: MapPin,
    name: "Services Nearby",
    description: "Browse services on a map",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-brand-yellow px-5 pt-10 pb-12">
        <h1 className="text-3xl font-black leading-tight text-gray-900 max-w-xs">
          Peer-validated services for youth and young adults
        </h1>
        <p className="mt-3 text-sm text-gray-800 max-w-xs">
          Search through hundreds of free support services in NYC that are right
          for you.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center bg-gray-900 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Get Started
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center border-2 border-gray-900 text-gray-900 text-sm font-bold px-6 py-3 rounded-xl hover:bg-black/5 transition"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Service Categories */}
      <section className="bg-white flex-1">
        <ul className="divide-y divide-gray-100">
          {services.map(({ icon: Icon, name, description }) => (
            <li key={name}>
              <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Testimonial */}
      <section className="bg-brand-dark px-5 py-12 text-white">
        <p className="text-xl font-black leading-snug max-w-xs">
          &ldquo;You&rsquo;re not alone in this journey&rdquo;
        </p>
        <p className="mt-4 text-sm text-gray-300 max-w-sm leading-relaxed">
          People can experience homelessness for many reasons. Our peer
          navigators share lived experience with the system and help you prepare
          for the future.
        </p>
        <div className="mt-6 border-t border-gray-600 pt-6">
          <blockquote className="text-sm text-gray-200 italic leading-relaxed">
            &ldquo;StreetLives was the most easy to understand and helped me find
            what I needed.&rdquo;
          </blockquote>
          <p className="mt-2 text-xs text-gray-400">— Jorge C.</p>
        </div>
      </section>

      {/* Provider CTA */}
      <section className="bg-gray-900 px-5 py-10 text-center">
        <p className="text-white font-bold text-lg">
          Are you a service provider?
        </p>
        <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
          Our provider portal can help you keep info updated and find other
          providers for client referrals.
        </p>
        <Link
          href="#"
          className="mt-5 inline-block bg-brand-yellow text-gray-900 text-sm font-bold px-6 py-3 rounded-xl hover:brightness-95 transition"
        >
          Sign Up for Provider Portal
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-5 py-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
          <a href="#" className="hover:text-gray-900 transition">About</a>
          <a href="#" className="hover:text-gray-900 transition">Leave Feedback</a>
          <a href="#" className="hover:text-gray-900 transition">Privacy Policy</a>
          <a href="#" className="hover:text-gray-900 transition">Terms of Use</a>
        </div>
        <p className="mt-4 text-xs text-gray-400">© StreetLives.org</p>
      </footer>
    </div>
  );
}
