import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ArchitecturalElement from '../components/ArchitecturalElement';

const NAV_ITEMS = [
  { id: 'hero', label: 'Home' },
  { id: 'plans', label: 'Membership Plans' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'services', label: 'Services' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'contact', label: 'Contact' },
];

const MembershipBenefitsGrid = forwardRef<HTMLDivElement>((props, ref) => {
  const benefits = [
    { 
      title: 'Design board', 
      description: 'Easily manage your design queue with a Trello board.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/70" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ),
      gradient: 'from-yellow-400 to-orange-500'
    },
    { 
      title: 'Fixed monthly rate', 
      description: 'No surprises here! Pay the same fixed price each month.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/70" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-400'
    },
    { 
      title: 'Fast delivery', 
      description: 'Get your design one at a time in just a couple days on average.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/70" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      ),
      gradient: 'from-orange-500 to-purple-600'
    },
    { 
      title: 'Top-notch quality', 
      description: 'Senior-level design quality at your fingertips, whenever you need it.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/70" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      gradient: 'from-pink-500 to-green-400'
    },
    { 
      title: 'Flexible and scalable', 
      description: 'Scale up or down as needed, and pause or cancel at anytime.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/70" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0h10v10H5V5z" clipRule="evenodd" />
        </svg>
      ),
      gradient: 'from-red-500 to-blue-500'
    },
    { 
      title: 'Uniques and all yours', 
      description: 'Each of the design is especially for you considering all your requirements.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.006h-4.992v4.992h4.992z" />
        </svg>
      ),
      gradient: 'from-sky-500 to-indigo-500'
    },
  ];

  return (
    <div ref={ref} className="flex gap-x-8 overflow-x-auto pb-8 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
      {benefits.map((benefit, i) => (
        <div key={i} className="text-left flex-shrink-0 w-64" style={{ scrollSnapAlign: 'start' }}>
          <div className={`relative w-full aspect-square bg-gradient-to-br ${benefit.gradient} rounded-3xl flex items-center justify-center mb-5 shadow-lg`}>
            <div className="absolute inset-0 bg-black/5 rounded-3xl"></div>
            {benefit.icon}
          </div>
          <h4 className="font-bold text-xl text-gray-800 mb-2">{benefit.title}</h4>
          <p className="text-gray-500 text-base">{benefit.description}</p>
        </div>
      ))}
    </div>
  );
});

const Home: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('hero');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const benefitsScrollRef = useRef<HTMLDivElement>(null);
  const [userSubs, setUserSubs] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => {
        if (el) {
          observer.unobserve(el);
        }
      });
    };
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

  const scrollBenefits = () => {
    if (benefitsScrollRef.current) {
      benefitsScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
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

  // PhonePe Payment Handler
  const handlePhonePePayment = async (amount: number, plan: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          plan,
          userId: user ? user.id : 'GUEST',
        }),
      });

      const data = await response.json();

      if (data.success && data.data.instrumentResponse.redirectInfo.url) {
        window.location.href = data.data.instrumentResponse.redirectInfo.url;
      } else {
        alert('Could not initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Could not initiate payment. Please try again.');
    }
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
    <div>
      {/* Bottom Sticky Navbar */}
      <nav className="fixed left-1/2 transform -translate-x-1/2 bottom-6 z-50 bg-black/80 shadow-xl rounded-full px-3 py-2 flex flex-wrap justify-center items-center gap-x-2 gap-y-1.5 border border-white/10 backdrop-blur-lg transition-all w-auto max-w-[95vw]">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`whitespace-nowrap text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black ${
              activeSection === item.id
                ? 'text-black bg-white shadow-sm'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
        className="relative w-full h-screen dotted-bg overflow-hidden"
      >
        {/* Video background */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="/Discover_landing_page.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black bg-opacity-60 z-0" />
        <div className="relative z-10 max-w-screen-xl mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight scroll-animate" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 1.5px 0 #000' }}>
            Discover Architects and Interior Designs
          </h1>
          <p className="mt-4 mb-10 text-2xl sm:text-2xl font-light text-white italic scroll-animate" style={{ transitionDelay: '200ms', textShadow: '0 2px 12px rgba(0,0,0,0.8), 0 1px 0 #000' }}>
            An Architecture and Interior Designing Platform With a Unique Spin
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 scroll-animate" style={{ transitionDelay: '400ms' }}>
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
              className="inline-block px-12 py-5 rounded-full bg-gradient-to-r from-pink-600 to-indigo-700 text-white font-bold text-xl shadow-lg border-0 hover:from-pink-700 hover:to-indigo-800 hover:scale-105 transition-all duration-200"
            >
              View Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Subsequent sections */}
      <div className="dotted-bg">
        {/* Membership Plans Section */}
        <section
          id="plans"
          ref={(el) => (sectionRefs.current['plans'] = el)}
          className="w-full"
        >
          <div className="max-w-screen-xl mx-auto px-4 py-24">
            <div className="mb-10 text-center scroll-animate">
              <span className="block text-gray-900 font-bold" style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '3.5rem', lineHeight: 1.1 }}>
                Simple subscription.
              </span>
              <span className="block text-indigo-700" style={{ fontFamily: 'Satisfy, cursive', fontStyle: 'italic', fontSize: '5rem', lineHeight: 1.1 }}>
                Limitless impact.
              </span>
            </div>
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Get to Know Us Card */}
              <div className="rounded-xl p-8 bg-gradient-to-br from-orange-400 via-pink-500 to-blue-600 flex flex-col items-center h-[350px] justify-between font-serif scroll-animate border-2 border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),_inset_0_2px_8px_rgba(255,255,255,0.6)]" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
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
              <div className="rounded-xl p-8 bg-gray-50 flex flex-col items-center h-[350px] justify-between font-serif scroll-animate border border-gray-200 shadow-xl" style={{ fontFamily: 'Times New Roman, Times, serif', transitionDelay: '200ms' }}>
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
                <button className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:from-indigo-600 hover:to-blue-600 transition" onClick={() => handlePhonePePayment(331600, "Standard")}>Choose Standard</button>
              </div>
              {/* Pro Plan */}
              <div className="rounded-xl p-8 bg-gray-50 flex flex-col items-center h-[350px] justify-between font-serif scroll-animate border border-gray-200 shadow-xl" style={{ fontFamily: 'Times New Roman, Times, serif', transitionDelay: '400ms' }}>
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
                <button className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold hover:from-indigo-600 hover:to-blue-600 transition" onClick={() => handlePhonePePayment(639600, "Pro")}>Choose Pro</button>
              </div>
            </div>
          </div>
        </section>

        {/* Satisfy font value statement between Membership Plans and Benefits */}
        <div className="w-full flex flex-col items-center justify-center scroll-animate">
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
          style={{ fontFamily: 'Times New Roman, Times, serif' }}
        >
          <div className="max-w-screen-xl mx-auto px-4 py-24">
            <div className="w-full text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, Times New Roman, Times, serif' }}>
                Membership benefits
              </h2>
            </div>
            <div className="relative scroll-animate" style={{ transitionDelay: '200ms' }}>
              <MembershipBenefitsGrid ref={benefitsScrollRef} />
              <button
                onClick={scrollBenefits}
                className="absolute top-32 -translate-y-1/2 -right-4 z-10 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition hidden md:flex items-center justify-center"
                aria-label="Scroll right"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Recent Work Section */}
        <section className="w-full">
          <div className="max-w-screen-xl mx-auto px-4 py-24 flex flex-col md:flex-row items-center justify-center gap-12">
            {/* Left: Pause anytime card */}
            <div className="w-full md:w-1/2 flex justify-end scroll-animate">
              <div className="w-full max-w-xl bg-black rounded-3xl p-8 flex items-center gap-6 shadow-sm border-2 border-white/10">
                <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-white border border-gray-200">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="16" fill="white"/>
                    <rect x="10" y="10" width="3" height="12" rx="1.5" fill="#222"/>
                    <rect x="19" y="10" width="3" height="12" rx="1.5" fill="#222"/>
                  </svg>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-2">Pause anytime</div>
                  <div className="text-lg text-gray-400">Temporarily pause your subscription anytime, no sweat.</div>
                </div>
              </div>
            </div>
            {/* Right: Recent Work content */}
            <div className="w-full md:w-1/2 flex justify-start scroll-animate" style={{ transitionDelay: '200ms' }}>
              <div className="max-w-md text-left">
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
          </div>
        </section>

        <div className="w-full text-center py-16 scroll-animate">
          <p className="text-3xl text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
            Where creativity meets functionality
          </p>
        </div>

        {/* Testimonial & Features Section */}
        <section className="w-full">
          <div className="max-w-screen-xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-16 items-start">
            {/* Left Column: Testimonial */}
            <div className="bg-gradient-to-br from-orange-400 via-pink-500 to-blue-600 rounded-2xl p-8 lg:p-12 text-white relative h-full flex flex-col justify-center scroll-animate border-2 border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),_inset_0_2px_8px_rgba(255,255,255,0.6)]" style={{fontFamily: 'Times New Roman, serif'}}>
              <span className="absolute top-8 left-8 text-6xl text-white/40 font-serif">"</span>
              <div className="relative pt-8">
                <blockquote className="text-3xl lg:text-4xl font-bold leading-tight">
                  Architecture should speak of its time and place, but yearn for timelessness.
                </blockquote>
                <div className="mt-8">
                  <p className="font-semibold text-lg">— Frank Gehry</p>
                </div>
              </div>
            </div>

            {/* Right Column: Features */}
            <div className="space-y-12 pt-8 scroll-animate" style={{ transitionDelay: '200ms', fontFamily: 'Times New Roman, serif' }}>
              <div>
                <h4 className="text-2xl font-bold text-gray-800 mb-3">Early Collaboration</h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  We believe in early collaboration. It gives us a clearer understanding of the project and ensures we're aligned with your goals from day one.
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-800 mb-3">Manage with Trello</h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Manage your design board using Trello. View active, queued and completed tasks with ease.
                </p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-800 mb-3">Invite unlimited team members</h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Invite your entire team, so anyone can submit requests and track their progress.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Image Section */}
        <section className="w-full flex justify-center py-16 scroll-animate">
          <div className="max-w-screen-lg px-4 w-full">
            <div className="flex flex-col md:flex-row gap-8 justify-center">
              <div className="w-full md:w-1/2">
                <img
                  src="/showcase.jpg"
                  alt="Showcase of architectural work"
                  className="rounded-2xl shadow-xl w-full h-full object-cover"
                />
              </div>
              <div className="w-full md:w-1/2">
                <img
                  src="/showcase2.webp"
                  alt="Second showcase of architectural work"
                  className="rounded-2xl shadow-xl w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-center text-gray-600 mt-6 text-lg" style={{fontFamily: 'Times New Roman, serif'}}>
              Designs commonly made using HPCL, Vipasana, Gurukul.
            </p>
          </div>
        </section>

        {/* Services Section */}
        <section
          id="services"
          ref={(el) => (sectionRefs.current['services'] = el)}
          className="w-full"
          style={{fontFamily: 'Times New Roman, serif'}}
        >
          <div className="max-w-screen-xl mx-auto px-4 py-24">
            <h2 className="text-center text-gray-900 font-bold mb-10 scroll-animate" style={{ fontFamily: 'Times New Roman, Times, serif', fontSize: '3.5rem', lineHeight: 1.1 }}>
              Elevations, Interior, Walkthroughs and more.
            </h2>
            <div className="flex flex-col gap-12">
              {/* Services we provide */}
              <div className="scroll-animate" style={{ transitionDelay: '200ms' }}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Services we provide</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {['2D Plan only', '2D & 3D Elevations', '2D & 3D Interior Details', 'Working Drawings', '3D Video- Walkthrough', 'Landscape Planning'].map((service, i) => (
                    <span key={service} className={`${i % 2 === 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'} px-4 py-2 rounded-full font-semibold text-sm`}>{service}</span>
                  ))}
                </div>
              </div>

              {/* Services we provide for */}
              <div className="scroll-animate" style={{ transitionDelay: '400ms' }}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Services we provide for</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Residences', 'Farmhouses', 'Commercial Residences', 'Resorts', 'Hotels', 'Hostels', 'Marriage Lawns', 'Plotting Drawings', 'Renovation', 'Schools', 'Coorporate Offices', 'Showrooms', 'Multipurpose Buildings', 'Parks', 'Medication Centres', 'Monastory', 'Temples'].map((service, i) => (
                    <span key={service} className={`${i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'} text-white px-4 py-2 rounded-full font-semibold text-sm`}>{service}</span>
                  ))}
                </div>
              </div>

              {/* Working drawings */}
              <div className="scroll-animate" style={{ transitionDelay: '600ms' }}>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Working drawings</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Column layout', 'Footing Layout', 'Brick Layout', "Door Window's Detail", 'Tile layout', 'Beam Layout', 'Slabs Layout', 'Electricals', 'Plumbing', 'RCC Details', 'Construction Details', '2D Plan', 'Furniture Layout', 'Any Special Detail Layout'].map((service, i) => (
                    <span key={service} className={`${i % 2 === 0 ? 'bg-pink-100 text-pink-800' : 'bg-orange-100 text-orange-800'} px-4 py-2 rounded-full font-semibold text-sm`}>{service}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pan-India Service Section */}
        <div className="w-full flex flex-col items-center justify-center py-20 scroll-animate">
          <span className="block text-center mb-4" style={{ fontFamily: 'Satisfy, cursive', fontSize: '4rem', color: '#be185d', lineHeight: '1.2' }}>
            Pan-India Service at Your Doorstep
          </span>
          <span className="block text-center text-gray-800 text-xl font-semibold">
            Call Now to Confirm Availability!
          </span>
        </div>

        {/* FAQs Section */}
        <section
          id="faqs"
          ref={(el) => (sectionRefs.current['faqs'] = el)}
          className="w-full"
        >
          <div className="max-w-screen-xl mx-auto px-4 py-24 flex flex-col md:flex-row gap-12">
            {/* Left: FAQ content */}
            <div className="w-full md:w-3/5 scroll-animate">
              <div className="mb-12">
                <h2 className="text-6xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Frequently asked questions
                </h2>
              </div>
              <FAQAccordion />
            </div>
            {/* Right: Call to action card */}
            <div className="hidden md:flex w-2/5 items-start justify-center pl-8 scroll-animate" style={{ transitionDelay: '200ms' }}>
              <div className="w-full max-w-md bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-3xl p-12 text-white flex flex-col justify-center border-2 border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),_inset_0_2px_8px_rgba(255,255,255,0.6)]">
                <h3 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Georgia, Times New Roman, Times, serif' }}>
                  Clarity from the Start
                </h3>
                <p className="text-xl text-gray-100" style={{ fontFamily: 'Times New Roman, Times, serif' }}>
                  We will work with estimation before construction and installation, for you to have a better budget idea.
                </p>
                <div className="mt-8 border-t border-white/20 pt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold">Prefer to email?</p>
                      <a href="mailto:admin@example.com" className="text-gray-200 hover:text-white">admin@example.com</a>
                    </div>
                  </div>
                  <a href="mailto:admin@example.com" className="bg-white rounded-full w-12 h-12 flex items-center justify-center text-black shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          ref={(el) => (sectionRefs.current['contact'] = el)}
          className="w-full text-white dotted-bg-dark"
        >
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 grid md:grid-cols-2 gap-16 items-center">
            {/* Left Column */}
            <div className="flex flex-col justify-between h-full text-left">
              <div className="scroll-animate">
                <img src="/logo.jpeg" alt="Discover Architects Logo" className="w-24 h-auto mb-8" />
                <h2 className="text-5xl md:text-6xl font-bold tracking-tighter">
                  Think we might be your perfect match?
                  <br />
                  <span className="text-gray-400 italic">(Spoiler: we are.)</span>
                </h2>
                <p className="mt-6 text-xl text-gray-300 max-w-lg">
                  Talk to us today.
                </p>
                <blockquote className="mt-12 pl-6 border-l-2 border-gray-700">
                  <p className="text-xl lg:text-2xl font-serif italic text-gray-200">
                    "Architecture is the learned game, correct & magnificent, of forms assembled in the light."
                  </p>
                  <cite className="mt-4 block font-sans not-italic text-gray-400">— Le Corbusier</cite>
                </blockquote>
              </div>
              <div className="mt-12 pt-8 border-t border-gray-800 scroll-animate" style={{ transitionDelay: '200ms' }}>
                <p className="text-sm text-gray-400">Headquartered in Lucknow, Uttar Pradesh.</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex items-center justify-center h-full scroll-animate" style={{ transitionDelay: '200ms' }}>
              <div className="w-full max-w-md bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-3xl p-10 lg:p-16 text-white flex flex-col items-center justify-center text-center min-h-[450px] relative border-2 border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),_inset_0_2px_8px_rgba(255,255,255,0.6)]">
                <div className="absolute top-6 left-6 flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full font-semibold text-sm">
                  <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>
                  <span>Start today</span>
                </div>
                <h3 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Georgia, Times New Roman, Times, serif' }}>
                  Reach out, we're listening!
                </h3>
                <p className="text-lg mb-10 mt-2">
                  Let's build something amazing together.
                </p>
                <div className="grid grid-cols-3 gap-x-10 gap-y-8">
                <a href="https://www.behance.net/discoverarchitect" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" style={{ animation: 'sway 3s ease-in-out infinite alternate' }}>
                    <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/behance.svg" alt="Behance" className="w-10 h-10 mx-auto" />
                </a>
                <a href="https://www.whatsapp.com/catalog/917976679380" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" style={{ animation: 'sway 3s ease-in-out infinite alternate' }}>
                    <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg" alt="WhatsApp" className="w-10 h-10 mx-auto" />
                </a>
                <a href="https://www.pinterest.com/discoverarchitectsdesigns" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" style={{ animation: 'sway 3s ease-in-out infinite alternate' }}>
                    <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/pinterest.svg" alt="Pinterest" className="w-10 h-10 mx-auto" />
                </a>
                <a href="https://www.linkedin.com/in/ananya-mishra-341801158?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" style={{ animation: 'sway 3s ease-in-out infinite alternate' }}>
                    <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg" alt="LinkedIn" className="w-10 h-10 mx-auto" />
                </a>
                <a href="https://www.instagram.com/discover_architect_ananya?igsh=MWphMW1mc3E0N3RrNA==" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" style={{ animation: 'sway 3s ease-in-out infinite alternate' }}>
                    <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" alt="Instagram" className="w-10 h-10 mx-auto" />
                </a>
                  <a href="https://www.google.com/maps/place/Discover+Architects+%26+Interior+Designs/@26.8772615,81.0174555,786m/data=!3m2!1e3!4b1!4m6!3m5!1s0x399be3f5b0356de7:0xfe5a2c0ddc6ea47a!8m2!3d26.8772615!4d81.0200304!16s%2Fg%2F11p0w485tb?entry=ttu" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" style={{ animation: 'sway 3s ease-in-out infinite alternate' }}>
                    <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/googlemaps.svg" alt="Google Maps" className="w-10 h-10 mx-auto" />
                  </a>
                </div>
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
      </div>
    </div>
  );
};

// FAQ Accordion Component
const FAQAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
      q: `Are there any refunds if I don't like the service?`,
      a: `Due to the high quality nature of the work, there will be no refunds issued.`
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="border-b border-gray-300 last:border-b-0">
          <button
            onClick={() => toggleFAQ(index)}
            className="w-full flex justify-between items-center py-5 text-left"
          >
            <span className="text-xl font-medium text-gray-900">{faq.q}</span>
            <svg
              className={`w-6 h-6 text-gray-500 transform transition-transform duration-300 ${
                openIndex === index ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              openIndex === index ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <p className="pt-2 pb-6 text-gray-600 leading-relaxed">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Home; 