import { useEffect, useRef, useState } from 'react'
import {
  Clock,
  Zap,
  Battery,
  LayoutGrid,
  BarChart2,
  Brain,
  Smartphone,
  ClipboardList,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    number: '01',
    title: 'Log your day',
    description:
      'Tap a preset, set the time, add context. Done in under 15 seconds. No friction, no excuses.',
    icon: ClipboardList,
    iconClassName: 'bg-blue-500',
  },
  {
    number: '02',
    title: 'Track your patterns',
    description:
      'Every entry builds your personal dataset. See where your hours really go - not where you think they go.',
    icon: BarChart2,
    iconClassName: 'bg-purple-500',
  },
  {
    number: '03',
    title: 'Improve deliberately',
    description:
      'Weekly charts, hourly heatmaps, and deep pattern insights show you exactly what to change and when.',
    icon: TrendingUp,
    iconClassName: 'bg-green-500',
  },
]

const FEATURES = [
  {
    title: 'Log in 15 seconds',
    description:
      'Quick-tap presets for every activity. One tap selects the activity, set the time, save. No typing, no friction, no excuses.',
    icon: Zap,
    iconClassName: 'bg-blue-500',
  },
  {
    title: 'Track your energy',
    description:
      'Log energy before and after every activity. Discover what truly drains you and what gives you power throughout the day.',
    icon: Battery,
    iconClassName: 'bg-green-500',
  },
  {
    title: 'Hourly heatmap',
    description:
      'Visualise your most productive hours across every day of the week. Stop guessing when you work best - the data shows you.',
    icon: LayoutGrid,
    iconClassName: 'bg-purple-500',
  },
  {
    title: 'Weekly patterns',
    description:
      'Compare this week vs last week with trend arrows. See your real trajectory and whether you are actually improving over time.',
    icon: BarChart2,
    iconClassName: 'bg-amber-500',
  },
  {
    title: 'Behaviour patterns',
    description:
      'What triggers your social media use? Which location kills your focus? Six deep insights expose the patterns behind your habits.',
    icon: Brain,
    iconClassName: 'bg-red-500',
  },
  {
    title: 'Works everywhere',
    description:
      'Installable as an app on your phone. Log on mobile throughout the day, analyse deeply on desktop. Always perfectly in sync.',
    icon: Smartphone,
    iconClassName: 'bg-teal-500',
  },
]

const PRESET_MOCKUPS = [
  { emoji: '📱', name: 'Instagram', active: true },
  { emoji: '▶️', name: 'YouTube' },
  { emoji: '🧠', name: 'ML Study' },
  { emoji: '💻', name: 'Coding' },
  { emoji: '🎓', name: 'Uni' },
  { emoji: '💼', name: 'Job' },
  { emoji: '📚', name: 'Reading' },
  { emoji: '🏃', name: 'Exercise' },
  { emoji: '🍳', name: 'Cooking' },
]

const DEMO_BARS = [
  { label: 'M', height: '2rem', className: 'bg-blue-400' },
  { label: 'T', height: '3rem', className: 'bg-blue-500' },
  { label: 'W', height: '1.5rem', className: 'bg-blue-300' },
  { label: 'T', height: '3.5rem', className: 'bg-blue-500' },
  { label: 'F', height: '2.5rem', className: 'bg-blue-400' },
  { label: 'S', height: '1rem', className: 'bg-amber-300' },
  { label: 'S', height: '1.5rem', className: 'bg-amber-300' },
]

function useScrollAnimation(threshold = 0.1) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold }
    )

    if (ref.current) observer.observe(ref.current)

    return () => observer.disconnect()
  }, [threshold])

  return [ref, isVisible]
}

function PhoneFrame({ children, className = '' }) {
  return (
    <div className={`mx-auto w-56 rounded-[2.5rem] border-4 border-gray-800 bg-gray-900 p-2 shadow-2xl md:w-64 ${className}`}>
      <div className="flex h-96 w-full flex-col overflow-hidden rounded-[2rem] bg-white dark:bg-gray-900">
        {children}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [navScrolled, setNavScrolled] = useState(false)
  const [howItWorksRef, howItWorksVisible] = useScrollAnimation(0.2)
  const [demoRef, demoVisible] = useScrollAnimation(0.2)
  const [featuresRef, featuresVisible] = useScrollAnimation(0.15)
  const [socialProofRef, socialProofVisible] = useScrollAnimation(0.15)
  const [ctaRef, ctaVisible] = useScrollAnimation(0.15)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 8)

    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToSection(id) {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const element = document.getElementById(id)
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <style>
        {`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          .animate-fade-up {
            animation: fadeUp 0.6s ease forwards;
          }
        `}
      </style>

      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 h-16 px-6 transition-all md:px-12',
          navScrolled
            ? 'bg-white/80 shadow-sm backdrop-blur-md dark:bg-gray-950/80'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between">
          <button type="button" onClick={() => navigate('/')} className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="ml-2 font-bold text-gray-900 dark:text-white">
              Life Pattern Tracker
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/log')}
              className="hidden rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300 md:block"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('/log')}
              className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center">
        <div
          className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
          style={{ animation: 'float 6s ease-in-out infinite' }}
        />
        <div
          className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl"
          style={{ animation: 'float 8s ease-in-out infinite reverse' }}
        />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div
            className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
            style={{ animationDelay: '0.2s', opacity: 0 }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            <span>Personal productivity, reimagined</span>
          </div>

          <h1
            className="animate-fade-up mb-6 text-5xl font-bold leading-tight text-gray-900 dark:text-white md:text-7xl"
            style={{ animationDelay: '0.4s', opacity: 0 }}
          >
            <span className="block">Know yourself</span>
            <span className="block">
              through your <span className="text-blue-500">time.</span>
            </span>
          </h1>

          <p
            className="animate-fade-up mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400 md:text-xl"
            style={{ animationDelay: '0.6s', opacity: 0 }}
          >
            Track every hour. Discover your patterns. Build the life you actually want.
          </p>

          <div
            className="animate-fade-up flex flex-wrap justify-center gap-4"
            style={{ animationDelay: '0.8s', opacity: 0 }}
          >
            <button
              type="button"
              onClick={() => navigate('/log')}
              className="rounded-full bg-blue-500 px-8 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:bg-blue-600"
            >
              Start Tracking Free
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="rounded-full border border-gray-300 px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              See how it works
            </button>
          </div>

          <p
            className="animate-fade-up mt-6 text-sm text-gray-400"
            style={{ animationDelay: '1.0s', opacity: 0 }}
          >
            No credit card. No complicated setup. Just clarity.
          </p>
        </div>
      </section>

      <section id="how-it-works" ref={howItWorksRef} className="bg-gray-50 px-6 py-24 dark:bg-gray-900/50">
        <div
          className={`transition-all duration-700 ${
            howItWorksVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-500">
              The process
            </p>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Simple by design
            </h2>
            <p className="mx-auto mb-16 max-w-xl text-center text-gray-500 dark:text-gray-400">
              Three steps to understanding yourself better
            </p>
          </div>

          <div className="relative mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="absolute top-16 left-1/4 right-1/4 z-0 hidden border-t-2 border-dashed border-gray-200 dark:border-gray-700 md:block" />

            {STEPS.map((step, index) => {
              const Icon = step.icon

              return (
                <article
                  key={step.number}
                  className={[
                    'relative z-10 rounded-2xl border border-gray-100 bg-white p-8 text-center transition-all duration-700 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800',
                    howItWorksVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                  ].join(' ')}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <span className="absolute top-4 right-4 text-7xl font-black text-gray-100 dark:text-gray-700/50">
                    {step.number}
                  </span>
                  <div
                    className={[
                      'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
                      step.iconClassName,
                    ].join(' ')}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {step.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="demo" ref={demoRef} className="bg-white px-6 py-24 dark:bg-gray-950">
        <div
          className={`transition-all duration-700 ${
            demoVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-500">
              The app
            </p>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              See it in action
            </h2>
            <p className="mb-16 text-center text-gray-500 dark:text-gray-400">
              Everything you need, nothing you don&apos;t
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 items-end gap-8 md:grid-cols-3">
            <div
              className={`transition-all duration-700 ease-out ${
                demoVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: '0ms' }}
            >
              <PhoneFrame>
                <div className="bg-blue-500 p-4 text-sm font-semibold text-white">Log Entry</div>
                <div className="grid grid-cols-3 gap-2 p-3">
                  {PRESET_MOCKUPS.map((preset) => (
                    <div
                      key={preset.name}
                      className={[
                        'aspect-square w-full rounded-xl text-center text-xs flex flex-col items-center justify-center gap-1',
                        preset.active
                          ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                          : 'bg-gray-100 dark:bg-gray-800',
                      ].join(' ')}
                    >
                      <span className="text-lg">{preset.emoji}</span>
                      <span>{preset.name}</span>
                    </div>
                  ))}
                </div>
              </PhoneFrame>
              <div className="mt-6 text-center">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Log in seconds
                </p>
                <p className="mt-1 text-sm text-gray-500">Quick-tap any activity</p>
              </div>
            </div>

            <div
              className={`transition-all duration-700 ease-out ${
                demoVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: '150ms' }}
            >
              <PhoneFrame className="md:scale-105">
                <div className="border-b border-gray-100 bg-white p-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  Today - April 5
                </div>
                <div className="space-y-2 p-3">
                  <div className="mb-3 grid grid-cols-2 gap-1.5">
                    {[
                      ['Total', '5h 20m'],
                      ['Productive', '3h 45m'],
                      ['Social', '45m'],
                      ['Entries', '8'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-gray-50 p-2 dark:bg-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-300">{label}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  {[
                    ['ML Study', '2h', '#3B82F6'],
                    ['Instagram', '30m', '#F59E0B'],
                    ['Coding', '1h 15m', '#14B8A6'],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      className="mb-1 flex items-center gap-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-700"
                    >
                      <div className="h-8 w-0.5 rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{label}</p>
                      </div>
                      <p className="text-xs text-gray-400">{value}</p>
                    </div>
                  ))}
                </div>
              </PhoneFrame>
              <div className="mt-6 text-center">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  See your day clearly
                </p>
                <p className="mt-1 text-sm text-gray-500">Stats and timeline at a glance</p>
              </div>
            </div>

            <div
              className={`transition-all duration-700 ease-out ${
                demoVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              <PhoneFrame>
                <div className="border-b border-gray-100 bg-white p-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  Insights
                </div>
                <div className="flex gap-1 overflow-hidden px-2 pb-2 pt-2">
                  <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] text-white">Week</span>
                  <span className="rounded-full bg-gray-700 px-1.5 py-0.5 text-[9px] text-gray-400">Map</span>
                  <span className="rounded-full bg-gray-700 px-1.5 py-0.5 text-[9px] text-gray-400">W/W</span>
                  <span className="rounded-full bg-gray-700 px-1.5 py-0.5 text-[9px] text-gray-400">Trends</span>
                </div>
                <div className="p-3">
                  <div className="mb-3 grid grid-cols-3 gap-1">
                    {[
                      ['Productive', '12h'],
                      ['Social', '3h'],
                      ['Regret', '60%'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-gray-50 p-1.5 text-center dark:bg-gray-800">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mb-1 text-xs text-gray-400">This week</p>
                  <div className="flex h-16 items-end gap-0.5">
                    {DEMO_BARS.map((bar) => (
                      <div
                        key={`${bar.label}-${bar.height}`}
                        className={`flex-1 rounded-t-sm ${bar.className}`}
                        style={{ height: bar.height }}
                      />
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-300">
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                    <span>S</span>
                  </div>
                </div>
              </PhoneFrame>
              <div className="mt-6 text-center">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  Discover your patterns
                </p>
                <p className="mt-1 text-sm text-gray-500">Charts and insights that matter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" ref={featuresRef} className="bg-gray-50 px-6 py-24 dark:bg-gray-900/50">
        <div
          className={`transition-all duration-700 ${
            featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="mx-auto max-w-5xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-500">
              Features
            </p>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Everything you need to know yourself
            </h2>
            <p className="mx-auto mb-16 max-w-xl text-center text-gray-500 dark:text-gray-400">
              Built around the data that actually predicts behaviour
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon

              return (
                <article
                  key={feature.title}
                  className={[
                    'cursor-default rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-700 hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800',
                    featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                  ].join(' ')}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div
                    className={[
                      'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
                      feature.iconClassName,
                    ].join(' ')}
                  >
                    <Icon className="h-[22px] w-[22px] text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section ref={socialProofRef} className="bg-gray-900 px-6 py-24 dark:bg-gray-950">
        <div
          className={`mx-auto max-w-4xl text-center transition-all duration-700 ${
            socialProofVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <p className="mb-0 font-serif text-8xl leading-none text-blue-500/30">&quot;</p>
          <p className="mx-auto mb-12 max-w-3xl text-2xl font-medium leading-relaxed text-white md:text-3xl">
            Built for people who want to understand themselves better - not just stay busy.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            {[
              ['11', 'activity presets'],
              ['6', 'deep insights'],
              ['1', 'honest mirror'],
            ].map(([value, label], index) => (
              <div
                key={label}
                className={[
                  'rounded-2xl border border-gray-700 bg-gray-800 px-8 py-6 text-center transition-all duration-700',
                  socialProofVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
                ].join(' ')}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <p className="mb-1 text-3xl font-bold text-blue-400">{value}</p>
                <p className="text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="bg-white px-6 py-24 text-center dark:bg-gray-950">
        <div
          className={`mx-auto transition-all duration-700 ${
            ctaVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="mx-auto mb-12 h-1 w-16 rounded-full bg-blue-500" />
          <h2 className="mx-auto mb-6 max-w-2xl text-3xl font-bold text-gray-900 dark:text-white md:text-5xl">
            Ready to see where your time really goes?
          </h2>
          <p className="mb-10 text-lg text-gray-500 dark:text-gray-400">
            Start logging today. Your future self will thank you.
          </p>
          <button
            type="button"
            onClick={() => navigate('/log')}
            className="rounded-full bg-blue-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-105 hover:bg-blue-600"
          >
            Create your free account
          </button>
          <p className="mt-4 text-sm text-gray-400">Takes 30 seconds to set up</p>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-gray-50 px-6 py-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="ml-2 font-bold text-gray-900 dark:text-white">
                Life Pattern Tracker
              </span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-gray-400">
              Track your time. Know yourself. Build better habits one day at a time.
            </p>
          </div>

          <div className="md:text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Navigation
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <button type="button" onClick={() => scrollToSection('top')} className="block w-full hover:text-gray-900 dark:hover:text-white md:text-center">
                Home
              </button>
              <button type="button" onClick={() => scrollToSection('how-it-works')} className="block w-full hover:text-gray-900 dark:hover:text-white md:text-center">
                How it works
              </button>
              <button type="button" onClick={() => scrollToSection('features')} className="block w-full hover:text-gray-900 dark:hover:text-white md:text-center">
                Features
              </button>
              <button type="button" onClick={() => navigate('/log')} className="block w-full hover:text-gray-900 dark:hover:text-white md:text-center">
                Open App
              </button>
            </div>
          </div>

          <div className="md:text-right">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Built with
            </p>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>React + Vite</p>
              <p>Supabase</p>
              <p>Tailwind CSS</p>
              <p>Deployed on Vercel</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-5xl border-t border-gray-200 pt-8 text-center text-xs text-gray-400 dark:border-gray-800">
          © 2026 Life Pattern Tracker. Made for self-improvement.
        </div>
      </footer>
    </div>
  )
}
