import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'plans', label: 'Membership Plans' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'services', label: 'Services' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'contact', label: 'Contact' },
];

const Home: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('hero');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const [userSubs, setUserSubs] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Calendly Badge Widget injection (must be inside the component)
  useEffect(() => {
    // Inject Calendly CSS if not already present
    if (!document.getElementById('calendly-widget-css')) {
      const link = document.createElement('link');
      link.id = 'calendly-widget-css';
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }
    // Inject Calendly JS if not already present
    if (!document.getElementById('calendly-widget-js')) {
      const script = document.createElement('script');
      script.id = 'calendly-widget-js';
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        // @ts-ignore
        const Calendly: any = (window as any).Calendly;
        if (Calendly) {
          Calendly.initBadgeWidget({
            url: 'https://calendly.com/jollyjackabee/15min-intro-call',
            text: 'Schedule time with me',
            color: '#0069ff',
            textColor: '#ffffff',
          });
        }
      };
    } else {
      // @ts-ignore
      const Calendly: any = (window as any).Calendly;
      if (Calendly) {
        Calendly.initBadgeWidget({
          url: 'https://calendly.com/jollyjackabee/15min-intro-call',
          text: 'Schedule time with me',
          color: '#0069ff',
          textColor: '#ffffff',
        });
      }
    }
  }, []);

  // Smooth scroll and section highlight
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      let current = 'hero';
      for (const item of NAV_ITEMS) {
        const ref = sectionRefs.current[item.id];
        if (ref && ref.offsetTop <= scrollPosition) {
          current = item.id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const ref = sectionRefs.current[id];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!document.getElementById('satisfy-font')) {
      const link = document.createElement('link');
      link.id = 'satisfy-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Razorpay handler
  const handleRazorpayPayment = (amount: number, plan: string) => {
    const options = {
      key: "rzp_test_1234567890abcdef", // Dummy test key, replace with your real key when available
      amount: amount * 100, // Amount in paise
      currency: "INR",
      name: "Architect Web",
      description: `Purchase ${plan} Plan`,
      handler: function (response: any) {
        alert("Payment successful! Payment ID: " + response.razorpay_payment_id);
      },
      prefill: {
        name: "Test User",
        email: "test@example.com",
      },
      theme: {
        color: "#3399cc",
      },
    };
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  useEffect(() => {
    if (user) {
      setLoadingSubs(true);
      fetch(`/api/admin/user/${user.id}/subscriptions`)
        .then(res => res.json())
        .then(data => setUserSubs(data))
        .finally(() => setLoadingSubs(false));
    }
  }, [user]);

  return (
    <>
      {/* Bottom Sticky Navbar */}
      <nav className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50 bg-white/90 shadow-xl rounded-2xl px-8 py-3 flex justify-center items-center gap-8 border border-indigo-100 backdrop-blur-md transition-all max-w-4xl w-[95vw] min-w-[320px]">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`whitespace-nowrap text-base sm:text-lg font-semibold px-5 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
              activeSection === item.id
                ? 'text-indigo-600 bg-indigo-50 shadow font-bold'
                : 'text-gray-700 hover:text-indigo-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        ref={(el) => (sectionRefs.current['hero'] = el)}
        className="w-full"
        style={{ background: '#fff' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-24 flex flex-col items-center justify-center min-h-[80vh]">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Discover Architects and Interior Designs
          </h1>
          <p className="mt-4 mb-10 text-2xl sm:text-2xl font-light text-indigo-700 italic drop-shadow-md">
            An Architecture and Interior Designing Platform With a Unique Spin
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {!user && (
              <Link
                to="/signup"
                className="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-lg font-semibold shadow-lg hover:from-indigo-600 hover:to-blue-600 transition-all duration-200"
              >
                Sign Up
              </Link>
            )}
            <Link
              to="/gallery"
              className="inline-block px-10 py-4 rounded-full bg-white text-indigo-700 border-2 border-indigo-500 font-semibold text-lg shadow-md hover:bg-indigo-50 hover:scale-105 transition-all duration-200"
            >
              View Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Membership Plans Section */}
      <section
        id="plans"
        ref={(el) => (sectionRefs.current['plans'] = el)}
        className="w-full"
        style={{ background: '#fff' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-24">
          <div className="mb-10 text-center">
            <span className="block text-gray-900 font-bold" style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '3.5rem', lineHeight: 1.1 }}>
              Simple subscription.
            </span>
            <span className="block text-indigo-700" style={{ fontFamily: 'Satisfy, cursive', fontSize: '5rem', lineHeight: 1.1 }}>
              Limitless impact.
            </span>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Get to Know Us Card */}
            <div className="rounded-xl shadow-lg p-8 bg-gradient-to-br from-orange-400 via-pink-500 to-blue-600 border-2 border-indigo-100 flex flex-col items-center h-[350px] justify-between font-serif" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
              <h3 className="text-3xl font-extrabold text-white mb-4 text-center">Get to Know Us</h3>
              <div className="flex-1 flex flex-col justify-end w-full">
                <a
                  href="https://calendly.com/jollyjackabee/15min-intro-call"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-black rounded-lg p-4 flex flex-col items-center justify-center transition hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 mt-auto text-white text-lg font-bold mb-4 text-center"
                >
                  Book a 15-min intro call
                </a>
                <span className="text-white text-center text-base font-normal">Learn more about how Discover Architects works and how it can help you.</span>
              </div>
            </div>
            {/* Standard Plan */}
            <div className="rounded-xl shadow-lg p-8 bg-gray-50 border-2 border-indigo-100 flex flex-col items-center h-[350px] justify-between font-serif" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
              <h3 className="text-xl font-semibold mb-2">Standard Plan</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-2">₹3,31,600<span className="text-base font-normal">/-</span></div>
              <div className="text-gray-700 mb-4 font-medium">Best for growing firms</div>
              <div className="mb-6 w-full">
                <div className="font-semibold mb-2">What's included:</div>
                <ul className="text-gray-700 text-left list-disc list-inside space-y-1">
                  <li>Unlimited design requests</li>
                  <li>Dedicated designer</li>
                  <li>Weekly updates</li>
                </ul>
              </div>
              <button className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:from-indigo-600 hover:to-blue-600 transition" onClick={() => handleRazorpayPayment(331600, "Standard")}>Choose Standard</button>
            </div>
            {/* Pro Plan */}
            <div className="rounded-xl shadow-lg p-8 bg-gray-50 border-2 border-indigo-100 flex flex-col items-center h-[350px] justify-between font-serif" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
              <h3 className="text-xl font-semibold mb-2">Pro Plan</h3>
              <div className="text-3xl font-bold text-indigo-600 mb-2">₹6,39,600<span className="text-base font-normal">/-</span></div>
              <div className="text-gray-700 mb-4 font-medium">For established businesses</div>
              <div className="mb-6 w-full">
                <div className="font-semibold mb-2">What's included:</div>
                <ul className="text-gray-700 text-left list-disc list-inside space-y-1">
                  <li>All Pro Plan features</li>
                  <li>Priority support</li>
                  <li>Custom branding</li>
                </ul>
              </div>
              <button className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:from-indigo-600 hover:to-blue-600 transition" onClick={() => handleRazorpayPayment(639600, "Pro")}>Choose Pro</button>
            </div>
          </div>
        </div>
      </section>

      {/* Satisfy font value statement between Membership Plans and Benefits */}
      <div className="w-full flex flex-col items-center justify-center">
        <span className="block text-center mt-8 mb-2" style={{ fontFamily: 'Satisfy, cursive', fontSize: '5rem', color: '#be185d' }}>
          One plan. Infinite value.
        </span>
        <span className="block text-center text-gray-700 text-lg mb-12">Perks too good to find anywhere else for your ideas.</span>
      </div>

      {/* Membership Benefits Section */}
      <section
        id="benefits"
        ref={(el) => (sectionRefs.current['benefits'] = el)}
        className="w-full"
        style={{ background: '#fff', fontFamily: 'Times New Roman, Times, serif' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-24 flex flex-col md:flex-row items-center justify-center min-h-[60vh]">
          {/* Left: Title */}
          <div className="w-full md:w-1/3 flex flex-col items-start justify-center h-full mb-10 md:mb-0">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, Times New Roman, Times, serif' }}>
              Membership<br />benefits
            </h2>
          </div>
          {/* Right: 6 cards in 3x2 grid */}
          <div className="w-full md:w-2/3 flex justify-center">
            <MembershipBenefitsGrid />
          </div>
        </div>
      </section>

      {/* Recent Work Section */}
      <section className="w-full" style={{ background: '#fff' }}>
        <div className="max-w-screen-xl mx-auto px-4 py-24 flex flex-col md:flex-row items-center justify-center gap-12 h-full min-h-[340px]">
          {/* Left: Pause anytime card */}
          <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
            <div className="w-full max-w-xl bg-black rounded-3xl border-2 border-dashed border-gray-300 p-8 flex items-start gap-6 shadow-sm">
              <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-white border border-gray-200 mr-4">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="white"/>
                  <rect x="10" y="10" width="3" height="12" rx="1.5" fill="#222"/>
                  <rect x="19" y="10" width="3" height="12" rx="1.5" fill="#222"/>
                </svg>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">Pause anytime</div>
                <div className="text-lg text-gray-400">Temporarily pause your subscription<br/>anytime, no sweat.</div>
              </div>
            </div>
          </div>
          {/* Right: Recent Work content */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start justify-center text-center md:text-left h-full">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Recent Work</h2>
            <p className="text-lg text-gray-500 mb-8">Heart winning design and nothing more.</p>
            <Link
              to="/gallery"
              className="inline-block px-10 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-lg font-semibold shadow-md hover:from-indigo-600 hover:to-blue-600 transition-all duration-200"
            >
              View recent work
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section
        id="services"
        ref={(el) => (sectionRefs.current['services'] = el)}
        className="w-full"
        style={{ background: '#fff' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-24">
          <h2 className="text-center text-gray-900 font-bold mb-10" style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '3.5rem', lineHeight: 1.1 }}>
            Elevations, Interior, Walkthroughs and more.
          </h2>
          <div className="flex flex-col gap-10">
            {/* Services we provide */}
            <div className="bg-gradient-to-br from-yellow-300 via-orange-400 to-purple-400 rounded-2xl shadow p-8 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Services we provide</h3>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">2D Plan only</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">2D & 3D Elevations</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">2D & 3D Interior Details</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Working Drawings</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">3D Video- Walkthrough</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Landscape Planning</li>
              </ul>
            </div>
            {/* Services we provide for */}
            <div className="bg-black rounded-2xl shadow p-8 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Services we provide for</h3>
              <ul className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Residences</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Farmhouses</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Commercial Residences</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Resorts</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Hotels</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Hostels</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Marriage Lawns</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Plotting Drawings</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Renovation</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Schools</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Coorporate Offices</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Showrooms</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Multipurpose Buildings</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Parks</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Medication Centres</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Monastory</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Temples</li>
              </ul>
            </div>
            {/* Working drawings */}
            <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-blue-600 rounded-2xl shadow p-8 flex flex-col items-center">
              <h3 className="text-xl font-bold text-white mb-4">Working drawings</h3>
              <ul className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Column layout</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Footing Layout</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Brick Layout</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Door Window's Detail</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Tile layout</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Beam Layout</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Slabs Layout</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Electricals</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Plumbing</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">RCC Details</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Construction Details</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">2D Plan</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Furniture Layout</li>
                <li className="bg-white rounded-lg px-4 py-2 shadow text-gray-800 text-center">Any Special Detail Layout</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section
        id="faqs"
        ref={(el) => (sectionRefs.current['faqs'] = el)}
        className="w-full bg-gray-100"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-24 flex flex-col md:flex-row gap-8">
          {/* Left: FAQ content */}
          <div className="w-full md:w-3/5">
            <div className="mb-10">
              <span className="block" style={{ fontFamily: 'Satisfy, cursive', fontSize: '3.5rem', color: '#111', lineHeight: 1 }}>
                Frequently
              </span>
              <span className="block text-5xl font-extrabold text-gray-900 leading-tight" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
                asked questions.
              </span>
            </div>
            <FAQAccordionCustom />
          </div>
          {/* Right: empty for now, 40% */}
          <div className="hidden md:block w-2/5"></div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        ref={(el) => (sectionRefs.current['contact'] = el)}
        className="w-full"
        style={{ background: '#fff' }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-24 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Contact & Social Links</h2>
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <div className="flex flex-row flex-wrap gap-8 justify-center items-center">
              <a href="https://www.behance.net/discoverarchitect" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/behance.svg" alt="Behance" className="w-12 h-12" />
              </a>
              <a href="https://www.whatsapp.com/catalog/917976679380" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg" alt="WhatsApp" className="w-12 h-12" />
              </a>
              <a href="https://www.pinterest.com/discoverarchitectsdesigns" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/pinterest.svg" alt="Pinterest" className="w-12 h-12" />
              </a>
              <a href="https://www.linkedin.com/in/ananya-mishra-341801158?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" alt="LinkedIn" className="w-12 h-12" />
              </a>
              <a href="https://www.instagram.com/discover_architect_ananya?igsh=MWphMW1mc3E0N3RrNA==" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram" className="w-12 h-12" />
              </a>
              <a href="https://www.google.com/maps/place/Discover+Architects+%26+Interior+Designs/@26.8772615,81.0174555,786m/data=!3m2!1e3!4b1!4m6!3m5!1s0x399be3f5b0356de7:0xfe5a2c0ddc6ea47a!8m2!3d26.8772615!4d81.0200304!16s%2Fg%2F11p0w485tb?entry=ttu&g_ep=EgoyMDI0MDkxNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
                <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/googlemaps.svg" alt="Google Maps" className="w-12 h-12" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* User Membership Section */}
      {user && userSubs.length > 0 && (
        <section className="w-full bg-white py-8 mb-8 rounded-xl shadow">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Your Membership</h2>
            {loadingSubs ? (
              <div className="text-center text-gray-500">Loading membership...</div>
            ) : (
              <div className="space-y-4">
                {userSubs.map((sub, i) => (
                  <div key={sub.subscription_id + '-' + i} className="bg-gray-50 rounded p-4 shadow">
                    <div className="font-semibold">Plan: {sub.plan_name}</div>
                    <div>Start Date: {sub.start_date}</div>
                    <div>Status: {sub.status}</div>
                    {sub.period_start && (
                      <div>
                        {sub.status} from {sub.period_start}
                        {sub.period_end && ` to ${sub.period_end}`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
};

// FAQ Accordion Component
const FAQAccordion: React.FC = () => {
  const faqs = [
    {
      q: "Why wouldn't I just hire a full-time designer?",
      a: `Good question! For starters, the annual cost of a full-time senior-level designer now exceeds $100,000, plus benefits (and good luck finding one available). Aside from that, you may not always have enough work to keep them busy at all times, so you're stuck paying for time you aren't able to utilize. With the monthly plan, you can pause and resume your subscription as often as you need to ensure you're only paying your designer when you have work available for them.`
    },
    {
      q: 'Is there a limit to how many requests I can have?',
      a: `Once subscribed, you're able to add as many design requests to your queue as you'd like, and they will be delivered one by one.`
    },
    {
      q: 'How does the pause feature work?',
      a: `We understand you may not have enough design work to fill up entire month. Perhaps you only have one or two design requests at the moment. That's where pausing your subscription comes in handy. Billing cycles are based on 31 day period. Let's say you sign up and use the service for 21 days, and then decide to pause your subscription. This means that the billing cycle will be paused and you'll have 10 days of service remaining to be used anytime in the future.`
    },
    {
      q: 'What programs do you design in?',
      a: `Most requests are designed in Autocad for 2D, Skp for modelling and lumion for rendering.`
    },
    {
      q: `What if I don't like the work?`,
      a: `No worries! We will continue to revise the work until you all 100% satisfied.`
    },
    {
      q: `Is there any work you don't cover?`,
      a: `Absolutely. DAD does not cover the following work:`
    },
    {
      q: `Are there any refunds if I don't like the service?`,
      a: `Due to high quality nature of the work and services we provide, there will be no refunds.`
    },
    {
      q: `What if I only have a single request?`,
      a: `That's fine. You can pause your subscription when finished and return when you have additional needs. There's no need to let the remainder of your subscription go to waste.`
    },
  ];
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-indigo-200 rounded-lg bg-white shadow-sm">
          <button
            className="w-full flex justify-between items-center px-6 py-4 text-left text-lg font-medium text-indigo-700 focus:outline-none"
            onClick={() => setOpen(open === i ? null : i)}
          >
            {faq.q}
            <span className="ml-4 text-2xl">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div className="px-6 pb-4 text-gray-700 text-base animate-fade-in whitespace-pre-line">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Contact Form Component
const ContactForm: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
  };

  return submitted ? (
    <div className="text-green-600 text-lg font-semibold text-center">Thank you for contacting us!</div>
  ) : (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          value={form.name}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          value={form.email}
          onChange={handleChange}
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          value={form.message}
          onChange={handleChange}
        />
      </div>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button
        type="submit"
        className="w-full py-3 px-6 rounded-full bg-indigo-600 text-white font-semibold text-lg shadow-md hover:bg-indigo-700 transition-all"
      >
        Submit
      </button>
    </form>
  );
};

// Membership Benefits Grid Component
const MembershipBenefitsGrid: React.FC = () => {
  const benefits = [
    {
      icon: '🗂️',
      gradient: 'from-yellow-300 via-orange-400 to-purple-400',
      title: 'Design board',
      desc: 'Easily manage your design queue with a Trello board.'
    },
    {
      icon: '🔒',
      gradient: 'from-blue-300 via-purple-400 to-yellow-200',
      title: 'Fixed monthly rate',
      desc: 'No surprises here! Pay the same fixed price each month.'
    },
    {
      icon: '⚡',
      gradient: 'from-orange-400 via-pink-500 to-blue-600',
      title: 'Fast delivery',
      desc: 'Get your design one at a time in just a couple days on average.'
    },
    {
      icon: '⭐',
      gradient: 'from-pink-400 via-green-400 to-purple-400',
      title: 'Top-notch quality',
      desc: 'Senior-level design quality at your fingertips, whenever you need it.'
    },
    {
      icon: '🧩',
      gradient: 'from-red-400 via-blue-400 to-purple-400',
      title: 'Flexible and scalable',
      desc: 'Scale up or down as needed, and pause or cancel at anytime.'
    },
    {
      icon: '🎁',
      gradient: 'from-yellow-400 via-pink-400 to-purple-400',
      title: 'All yours',
      desc: 'Each of your designs is made especially for you and considering all your requirements.'
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mx-auto">
      {benefits.slice(0, 3).map((b, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-56 h-56 flex flex-col items-center justify-between bg-white rounded-3xl shadow-lg mx-auto"
        >
          <div
            className={`w-56 h-28 flex items-center justify-center rounded-t-3xl bg-gradient-to-br ${b.gradient}`}
          >
            <span className="text-white text-5xl drop-shadow-lg">{b.icon}</span>
          </div>
          <div className="w-56 h-28 px-4 flex flex-col justify-center">
            <h3 className="text-base font-bold text-gray-900 mb-1 text-justify leading-snug break-words w-full">{b.title}</h3>
            <p className="text-gray-500 text-xs text-justify leading-snug break-words w-full">{b.desc}</p>
          </div>
        </div>
      ))}
      {benefits.slice(3, 6).map((b, i) => (
        <div
          key={i + 3}
          className="flex-shrink-0 w-56 h-56 flex flex-col items-center justify-between bg-white rounded-3xl shadow-lg mx-auto md:row-start-2"
        >
          <div
            className={`w-56 h-28 flex items-center justify-center rounded-t-3xl bg-gradient-to-br ${b.gradient}`}
          >
            <span className="text-white text-5xl drop-shadow-lg">{b.icon}</span>
          </div>
          <div className="w-56 h-28 px-4 flex flex-col justify-center">
            <h3 className="text-base font-bold text-gray-900 mb-1 text-justify leading-snug break-words w-full">{b.title}</h3>
            <p className="text-gray-500 text-xs text-justify leading-snug break-words w-full">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const faqsCustom = [
  {
    q: "Why wouldn't I just hire a full-time designer?",
    a: `Good question! For starters, the annual cost of a full-time senior-level designer now exceeds $100,000, plus benefits (and good luck finding one available). Aside from that, you may not always have enough work to keep them busy at all times, so you're stuck paying for time you aren't able to utilize. With the monthly plan, you can pause and resume your subscription as often as you need to ensure you're only paying your designer when you have work available for them.`
  },
  {
    q: 'Is there a limit to how many requests I can have?',
    a: `Once subscribed, you're able to add as many design requests to your queue as you'd like, and they will be delivered one by one.`
  },
  {
    q: 'How does the pause feature work?',
    a: `We understand you may not have enough design work to fill up entire month. Perhaps you only have one or two design requests at the moment. That's where pausing your subscription comes in handy. Billing cycles are based on 31 day period. Let's say you sign up and use the service for 21 days, and then decide to pause your subscription. This means that the billing cycle will be paused and you'll have 10 days of service remaining to be used anytime in the future.`
  },
  {
    q: 'What programs do you design in?',
    a: `Most requests are designed in Autocad for 2D, Skp for modelling and lumion for rendering.`
  },
  {
    q: `What if I don't like the work?`,
    a: `No worries! We will continue to revise the work until you all 100% satisfied.`
  },
  {
    q: `Is there any work you don't cover?`,
    a: `Absolutely. DAD does not cover the following work:`
  },
  {
    q: `Are there any refunds if I don't like the service?`,
    a: `Due to high quality nature of the work and services we provide, there will be no refunds.`
  },
  {
    q: `What if I only have a single request?`,
    a: `That's fine. You can pause your subscription when finished and return when you have additional needs. There's no need to let the remainder of your subscription go to waste.`
  },
];

function FAQAccordionCustom() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
      {faqsCustom.map((faq, i) => (
        <div key={i}>
          <button
            className="w-full flex justify-between items-center py-3 text-left text-lg md:text-xl text-gray-900 focus:outline-none"
            style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '1.1rem' }}
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{faq.q}</span>
            <span className="ml-4 text-2xl">{open === i ? '▼' : '▶'}</span>
          </button>
          {open === i && (
            <div className="pl-2 pr-2 pb-3 text-gray-400 text-base md:text-lg animate-fade-in" style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '1rem' }}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Home; 